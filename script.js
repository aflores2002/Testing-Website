document.addEventListener('DOMContentLoaded', () => {
        const connectionStatus = document.getElementById('connection-status');
        const messageInput = document.getElementById('message-input');
        const signMessageBtn = document.getElementById('sign-message-btn');
        const signatureResult = document.getElementById('signature-result');
        const psbtInput = document.getElementById('psbt-input');
        const signPsbtBtn = document.getElementById('sign-psbt-btn');
        const broadcastPsbtBtn = document.getElementById('broadcast-psbt-btn');
        const psbtResult = document.getElementById('psbt-result');
        const recipientAddressInput = document.getElementById('recipient-address');
        const amountInput = document.getElementById('amount');
        const createPsbtBtn = document.getElementById('create-psbt-btn');

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

                        setTimeout(() => {
                                window.removeEventListener("message", handleResponse);
                                reject(new Error("Extension did not respond in time"));
                        }, 15000); // Increased timeout to 15 seconds
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
                        if (response.success) {
                                signatureResult.textContent = `Signature: ${response.signature}`;
                        } else {
                                signatureResult.textContent = `Error: ${response.message || 'Failed to sign message'}`;
                        }
                } catch (error) {
                        console.error('Error signing message:', error);
                        signatureResult.textContent = `Error: ${error.message}`;
                }
        }

        async function signPSBT(psbtHex) {
                try {
                        const response = await sendMessageToExtension({ type: "FROM_PAGE_SIGN_PSBT", psbtHex });
                        if (response.success) {
                                psbtResult.textContent = `Signed PSBT: ${response.signedPsbtHex}`;
                        } else {
                                psbtResult.textContent = `Error: ${response.message || 'Failed to sign PSBT'}`;
                        }
                } catch (error) {
                        console.error('Error signing PSBT:', error);
                        psbtResult.textContent = `Error: ${error.message}`;
                }
        }

        async function broadcastPSBT(psbtHex) {
                try {
                        const response = await sendMessageToExtension({ type: "FROM_PAGE_BROADCAST_PSBT", psbtHex });
                        if (response.success) {
                                psbtResult.textContent = `Transaction broadcasted. TXID: ${response.txid}`;
                        } else {
                                psbtResult.textContent = `Error: ${response.message || 'Failed to broadcast PSBT'}`;
                        }
                } catch (error) {
                        console.error('Error broadcasting PSBT:', error);
                        psbtResult.textContent = `Error: ${error.message}`;
                }
        }

        async function createPSBT(senderAddress, recipientAddress, amountInSatoshis, feeRate = 1) {
                try {
                        const response = await sendMessageToExtension({
                                type: 'FROM_PAGE_CREATE_PSBT',
                                senderAddress,
                                recipientAddress,
                                amountInSatoshis,
                                feeRate
                        });
                        if (response.success) {
                                console.log('PSBT created:', response.psbtHex);
                                return response.psbtHex;
                        } else {
                                throw new Error(response.error);
                        }
                } catch (error) {
                        console.error('Error creating PSBT:', error);
                        throw error;
                }
        }

        async function getCurrentWalletAddress() {
                try {
                        const response = await sendMessageToExtension({ type: "FROM_PAGE_GET_CURRENT_ADDRESS" });
                        if (response.success) {
                                return response.address;
                        } else {
                                throw new Error(response.error || "Failed to get current wallet address");
                        }
                } catch (error) {
                        console.error('Error getting current wallet address:', error);
                        alert("Failed to get current wallet address. Please ensure you're logged in to the wallet.");
                        throw error;
                }
        }

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

        createPsbtBtn.addEventListener('click', async () => {
                const recipientAddress = recipientAddressInput.value;
                const amount = parseInt(amountInput.value);
                try {
                        const senderAddress = await getCurrentWalletAddress();
                        const psbtHex = await createPSBT(senderAddress, recipientAddress, amount);
                        psbtResult.textContent = `PSBT: ${psbtHex}`;
                } catch (error) {
                        console.error('Error creating PSBT:', error);
                        alert(`Error creating PSBT: ${error.message}`);
                }
        });

        window.addEventListener("message", function (event) {
                if (event.source != window) return;

                if (event.data.type === 'CONTENT_SCRIPT_LOADED') {
                        contentScriptLoaded = true;
                        checkExtensionConnection();
                }
        });

        checkExtensionConnection();
});