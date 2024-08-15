document.addEventListener('DOMContentLoaded', () => {
        const connectionStatus = document.getElementById('connection-status');
        const messageInput = document.getElementById('message-input');
        const signMessageBtn = document.getElementById('sign-message-btn');
        const signatureResult = document.getElementById('signature-result');
        const psbtInput = document.getElementById('psbt-input');
        const signPsbtBtn = document.getElementById('sign-psbt-btn');
        const broadcastPsbtBtn = document.getElementById('broadcast-psbt-btn');
        const psbtResult = document.getElementById('psbt-result');

        let contentScriptLoaded = false;

        function sendMessageToExtension(message) {
                return new Promise((resolve, reject) => {
                        window.postMessage(message, "*");

                        function handleResponse(event) {
                                if (event.source !== window) return;
                                if (event.data.type === "FROM_EXTENSION") {
                                        window.removeEventListener("message", handleResponse);
                                        if (event.data.action === "ERROR") {
                                                reject(new Error(event.data.message));
                                        } else {
                                                resolve(event.data);
                                        }
                                }
                        }

                        window.addEventListener("message", handleResponse);

                        // Set a timeout in case the extension doesn't respond
                        setTimeout(() => {
                                window.removeEventListener("message", handleResponse);
                                reject(new Error("Extension did not respond in time"));
                        }, 5000); // 5 second timeout
                });
        }

        async function checkExtensionConnection() {
                try {
                        const response = await sendMessageToExtension({ type: "FROM_PAGE_CHECK_CONNECTION" });
                        connectionStatus.textContent = response.connected ? "Extension connected" : "Extension not connected";
                } catch (error) {
                        console.error('Error checking extension connection:', error);
                        connectionStatus.textContent = "Error connecting to extension";
                }
        }

        async function signMessage(message) {
                try {
                        const response = await sendMessageToExtension({ type: "FROM_PAGE_SIGN_MESSAGE", message });
                        signatureResult.textContent = `Signature: ${response.signature}`;
                } catch (error) {
                        console.error('Error signing message:', error);
                        alert(`Error signing message: ${error.message}`);
                }
        }

        async function signPSBT(psbtHex) {
                try {
                        const response = await sendMessageToExtension({ type: "FROM_PAGE_SIGN_PSBT", psbtHex });
                        psbtResult.textContent = `Signed PSBT: ${response.signedPsbtHex}`;
                } catch (error) {
                        console.error('Error signing PSBT:', error);
                        alert(`Error signing PSBT: ${error.message}`);
                }
        }

        async function broadcastPSBT(psbtHex) {
                try {
                        const response = await sendMessageToExtension({ type: "FROM_PAGE_BROADCAST_PSBT", psbtHex });
                        psbtResult.textContent = `Transaction broadcasted. TXID: ${response.txid}`;
                } catch (error) {
                        console.error('Error broadcasting PSBT:', error);
                        alert(`Error broadcasting PSBT: ${error.message}`);
                }
        }

        // Event listeners for buttons
        signMessageBtn.addEventListener('click', () => {
                const message = messageInput.value;
                if (message) {
                        signMessage(message);
                }
        });

        signPsbtBtn.addEventListener('click', () => {
                const psbtHex = psbtInput.value;
                if (psbtHex) {
                        signPSBT(psbtHex);
                }
        });

        broadcastPsbtBtn.addEventListener('click', () => {
                const psbtHex = psbtInput.value;
                if (psbtHex) {
                        broadcastPSBT(psbtHex);
                }
        });

        // Listen for messages from the content script
        window.addEventListener("message", function (event) {
                if (event.source != window) return;

                if (event.data.type === 'CONTENT_SCRIPT_LOADED') {
                        contentScriptLoaded = true;
                        checkExtensionConnection();
                }
        });

        // Check connection status when the page loads
        checkExtensionConnection();
});