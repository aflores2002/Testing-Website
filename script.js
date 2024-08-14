document.addEventListener('DOMContentLoaded', () => {
        const connectionStatus = document.getElementById('connection-status');
        const messageInput = document.getElementById('message-input');
        const signMessageBtn = document.getElementById('sign-message-btn');
        const signatureResult = document.getElementById('signature-result');
        const psbtInput = document.getElementById('psbt-input');
        const signPsbtBtn = document.getElementById('sign-psbt-btn');
        const broadcastPsbtBtn = document.getElementById('broadcast-psbt-btn');
        const psbtResult = document.getElementById('psbt-result');

        // Check if the extension is installed and connected
        function checkExtensionConnection() {
                window.postMessage({ type: "CHECK_EXTENSION_CONNECTION" }, "*");
        }

        // Send a message to sign
        function signMessage(message) {
                window.postMessage({ type: "SIGN_MESSAGE", message }, "*");
        }

        // Send a PSBT to sign
        function signPSBT(psbtHex) {
                window.postMessage({ type: "SIGN_PSBT", psbtHex }, "*");
        }

        // Send a PSBT to broadcast
        function broadcastPSBT(psbtHex) {
                window.postMessage({ type: "BROADCAST_PSBT", psbtHex }, "*");
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

        // Listen for messages from the extension
        window.addEventListener("message", function (event) {
                if (event.source != window) return;
                if (event.data.type && (event.data.type == "FROM_EXTENSION")) {
                        switch (event.data.action) {
                                case "CONNECTION_STATUS":
                                        connectionStatus.textContent = event.data.connected ? "Extension connected" : "Extension not connected";
                                        break;
                                case "SIGNATURE_RESULT":
                                        signatureResult.textContent = `Signature: ${event.data.signature}`;
                                        break;
                                case "PSBT_SIGNED":
                                        psbtResult.textContent = `Signed PSBT: ${event.data.signedPsbtHex}`;
                                        break;
                                case "PSBT_BROADCASTED":
                                        psbtResult.textContent = `Transaction broadcasted. TXID: ${event.data.txid}`;
                                        break;
                                case "ERROR":
                                        alert(`Error: ${event.data.message}`);
                                        break;
                        }
                }
        });

        // Check connection status when the page loads
        checkExtensionConnection();
});