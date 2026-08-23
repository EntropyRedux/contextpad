use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::{Html, IntoResponse},
    routing::get,
    Router,
};
use std::sync::{Arc, RwLock};
use tokio::sync::broadcast;
use tower_http::cors::CorsLayer;

struct AppState {
    content: RwLock<String>,
    tx: broadcast::Sender<String>,
}

pub struct PreviewServer {
    port: u16,
    state: Arc<AppState>,
    shutdown_tx: Option<tokio::sync::oneshot::Sender<()>>,
}

impl PreviewServer {
    pub fn new() -> Self {
        let (tx, _rx) = broadcast::channel(100);
        Self {
            port: 3000,
            state: Arc::new(AppState {
                content: RwLock::new(String::from("<h1>Waiting for content...</h1>")),
                tx,
            }),
            shutdown_tx: None,
        }
    }

    pub async fn start(&mut self) -> Result<u16, String> {
        if self.shutdown_tx.is_some() {
            return Ok(self.port);
        }

        let state = self.state.clone();
        
        let cors = CorsLayer::new()
            .allow_origin(tower_http::cors::Any)
            .allow_methods(tower_http::cors::Any)
            .allow_headers(tower_http::cors::Any);

        let app = Router::new()
            .route("/", get(index_handler))
            .route("/ws", get(ws_handler))
            .layer(cors)
            .with_state(state);

        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .map_err(|e| e.to_string())?;
        
        let port = listener.local_addr().map_err(|e| e.to_string())?.port();
        self.port = port;

        let (tx, rx) = tokio::sync::oneshot::channel();
        self.shutdown_tx = Some(tx);

        tokio::spawn(async move {
            axum::serve(listener, app)
                .with_graceful_shutdown(async {
                    rx.await.ok();
                })
                .await
                .unwrap();
        });

        Ok(port)
    }

    pub fn update_content(&self, html: String) {
        if let Ok(mut content) = self.state.content.write() {
            *content = html.clone();
        }
        let _ = self.state.tx.send(html);
    }

    pub fn stop(&mut self) {
        if let Some(tx) = self.shutdown_tx.take() {
            let _ = tx.send(());
        }
    }
}

async fn index_handler(State(state): State<Arc<AppState>>) -> Html<String> {
    let content = state.content.read().unwrap().clone();
    
    let ws_script = r#"
    <script>
        // WebSocket with automatic reconnection
        (function() {
            let ws = null;
            let reconnectAttempts = 0;
            const maxReconnectAttempts = 10;
            const baseReconnectDelay = 1000; // 1 second

            function updateStatus(message, isError) {
                const status = document.getElementById('lib-status');
                if (status) {
                    status.textContent = message;
                    status.style.color = isError ? '#ef4444' : '#9d9d9d';
                }
            }

            function connect() {
                const wsUrl = "ws://" + window.location.host + "/ws";
                console.log("Connecting to WebSocket:", wsUrl);

                try {
                    ws = new WebSocket(wsUrl);
                } catch (e) {
                    console.error("WebSocket creation failed:", e);
                    scheduleReconnect();
                    return;
                }

                ws.onopen = function() {
                    console.log("Connected to ContextPad Preview");
                    reconnectAttempts = 0;
                    updateStatus("Connected - Live updates active", false);
                };

                ws.onmessage = async function(event) {
                    try {
                        const newDoc = new DOMParser().parseFromString(event.data, 'text/html');

                        const contentDiv = document.getElementById('content');
                        const newContent = newDoc.getElementById('content');
                        
                        const tocSidebar = document.querySelector('.toc-sidebar');
                        const newTocSidebar = newDoc.querySelector('.toc-sidebar');

                        // If major structural difference (e.g. containers missing), full body replacement
                        if (!contentDiv || !newContent || (newTocSidebar && !tocSidebar)) {
                            console.log('[WebSocket] Structural change detected, full update');
                            document.body.innerHTML = newDoc.body.innerHTML;
                            // Re-init toggle button logic if we replaced the body
                            const toggleBtn = document.getElementById('toc-toggle');
                            const layout = document.getElementById('layout');
                            if (toggleBtn && layout) {
                                toggleBtn.onclick = () => { layout.classList.toggle('sidebar-expanded'); };
                            }
                        } else {
                            // SURGICAL UPDATE
                            // 1. Content
                            while (contentDiv.firstChild) contentDiv.removeChild(contentDiv.firstChild);
                            while (newContent.firstChild) contentDiv.appendChild(newContent.firstChild);

                            // 2. Layout class (for TOC visibility)
                            const layout = document.getElementById('layout');
                            const newLayout = newDoc.getElementById('layout');
                            if (layout && newLayout) {
                                layout.className = newLayout.className;
                            }

                        // 3. TOC
                        const tocWrapper = document.querySelector('.toc-wrapper');
                        const newTocWrapper = newDoc.querySelector('.toc-wrapper');
                        
                        if (tocWrapper && newTocWrapper) {
                            tocWrapper.innerHTML = newTocWrapper.innerHTML;
                        } else if (newTocWrapper && !tocWrapper) {
                            // If TOC was missing but now exists, we need a full body update
                            document.body.innerHTML = newDoc.body.innerHTML;
                            const toggleBtn = document.getElementById('toc-toggle');
                            const layout = document.getElementById('layout');
                            if (toggleBtn && layout) {
                                toggleBtn.onclick = () => { layout.classList.toggle('sidebar-expanded'); };
                            }
                        } else if (!newTocWrapper && tocWrapper) {
                            tocWrapper.innerHTML = '';
                        }
                        }

                        // Update theme style only (not CDN-injected styles)
                        const oldThemeStyle = document.getElementById('contextpad-theme');
                        const newThemeStyle = newDoc.getElementById('contextpad-theme');

                        if (oldThemeStyle && newThemeStyle) {
                            if (oldThemeStyle.textContent !== newThemeStyle.textContent) {
                                oldThemeStyle.textContent = newThemeStyle.textContent;
                            }
                        } else if (newThemeStyle) {
                            document.head.appendChild(newThemeStyle.cloneNode(true));
                        }

                        // Re-run library renderers
                        if (window.PreviewLibs) {
                            await window.PreviewLibs.renderAll(document.getElementById('content'));
                        }
                        
                        updateStatus("Updated", false);
                    } catch (error) {
                        console.error('WebSocket content update error:', error);
                        updateStatus("Update error: " + error.message, true);
                    }
                };

                ws.onclose = function(event) {
                    console.log("WebSocket closed:", event.code, event.reason);
                    ws = null;

                    if (event.code !== 1000) {
                        // Abnormal closure, try to reconnect
                        updateStatus("Disconnected - Reconnecting...", true);
                        scheduleReconnect();
                    } else {
                        updateStatus("Preview closed", false);
                    }
                };

                ws.onerror = function(e) {
                    console.error("WebSocket error:", e);
                    updateStatus("Connection error", true);
                };
            }

            function scheduleReconnect() {
                if (reconnectAttempts >= maxReconnectAttempts) {
                    updateStatus("Connection failed - Refresh to retry", true);
                    console.error("Max reconnection attempts reached");
                    return;
                }

                reconnectAttempts++;
                const delay = baseReconnectDelay * Math.pow(1.5, reconnectAttempts - 1);
                console.log("Reconnecting in " + delay + "ms (attempt " + reconnectAttempts + ")");

                setTimeout(connect, delay);
            }

            // Initial connection
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', connect);
            } else {
                connect();
            }

            // Handle Action button clicks in preview
            document.addEventListener('click', function(e) {
                const btn = e.target.closest('.cm-action-button');
                if (btn) {
                    const actionId = btn.getAttribute('data-action-id') || 'Unknown';
                    updateStatus('Action: ' + actionId, false);
                }
            });

            // Handle page visibility changes
            document.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'visible' && !ws) {
                    reconnectAttempts = 0;
                    connect();
                }
            });
        })();
    </script>
    "#;

    if content.contains("</body>") {
        Html(content.replace("</body>", &format!("{}</body>", ws_script)))
    } else {
        // Fallback if no body tag (should not happen with generateHTML)
        Html(format!("{}{}", content, ws_script))
    }
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(mut socket: WebSocket, state: Arc<AppState>) {
    let mut rx = state.tx.subscribe();

    while let Ok(msg) = rx.recv().await {
        if socket.send(Message::Text(msg)).await.is_err() {
            break;
        }
    }
}
