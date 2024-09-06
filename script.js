// script.js
document.addEventListener('DOMContentLoaded', () => {
        const walletStatus = document.getElementById('wallet-status');
        const connectWalletBtn = document.getElementById('connect-wallet-btn');
        const walletAddress = document.getElementById('wallet-address');
        const walletBalance = document.getElementById('wallet-balance');
        const messageInput = document.getElementById('message-input');
        const signMessageBtn = document.getElementById('sign-message-btn');
        const signatureResult = document.getElementById('signature-result');
        const recipientAddressInput = document.getElementById('recipient-address');
        const amountInput = document.getElementById('amount');
        // const sendTransactionBtn = document.getElementById('send-transaction-btn');
        const transactionResult = document.getElementById('transaction-result');

        const generatePsbtBtn = document.getElementById('generate-psbt-btn');
        const psbtResult = document.getElementById('psbt-result');


        let currentAccount = null;

        async function connectWallet() {
                console.log('Connecting wallet...');
                try {
                        const response = await window.bitcoin.request({ method: 'bitcoin_requestAccounts' });
                        console.log('Received accounts:', response);
                        if (response.success && Array.isArray(response.accounts) && response.accounts.length > 0) {
                                currentAccount = response.accounts[0];
                                walletStatus.textContent = 'Wallet connected';
                                walletAddress.textContent = `Address: ${currentAccount}`;
                                await updateBalance();
                        } else {
                                throw new Error('No accounts received');
                        }
                } catch (error) {
                        console.error('Error connecting wallet:', error);
                        walletStatus.textContent = 'Error connecting wallet';
                }
        }

        async function updateBalance() {
                if (!currentAccount) {
                        console.error('No account available for balance update');
                        return;
                }
                try {
                        const result = await window.bitcoin.request({
                                method: 'bitcoin_getBalance',
                                params: [currentAccount]
                        });
                        console.log('Balance result:', result);
                        if (result && typeof result.balance === 'number') {
                                walletBalance.textContent = `Balance: ${result.balance.toFixed(8)} BTC`;
                        } else {
                                throw new Error('Invalid balance received');
                        }
                } catch (error) {
                        console.error('Error fetching balance:', error);
                        walletBalance.textContent = 'Error fetching balance';
                }
        }

        async function signMessage() {
                if (!currentAccount) {
                        alert('Please connect your wallet first');
                        return;
                }
                const message = messageInput.value;
                if (!message) {
                        alert('Please enter a message to sign');
                        return;
                }
                try {
                        const result = await window.bitcoin.request({
                                method: 'bitcoin_signMessage',
                                params: [message, currentAccount]
                        });
                        console.log('Sign message result:', result); // Add this line for debugging

                        if (result && result.success) {
                                if (typeof result.signature === 'string') {
                                        signatureResult.textContent = `Signature: ${result.signature}`;
                                } else if (result.signature && typeof result.signature.signature === 'string') {
                                        signatureResult.textContent = `Signature: ${result.signature.signature}`;
                                } else {
                                        throw new Error('Invalid signature format');
                                }
                        } else {
                                throw new Error(result.error || 'Failed to sign message');
                        }
                } catch (error) {
                        console.error('Error signing message:', error);
                        signatureResult.textContent = `Error: ${error.message}`;
                }
        }

        // async function sendTransaction() {
        //         if (!currentAccount) {
        //                 alert('Please connect your wallet first');
        //                 return;
        //         }
        //         const recipientAddress = recipientAddressInput.value;
        //         const amount = parseFloat(amountInput.value);
        //         if (!recipientAddress || isNaN(amount)) {
        //                 alert('Please enter valid recipient address and amount');
        //                 return;
        //         }
        //         try {
        //                 const amountInSatoshis = Math.floor(amount * 100000000); // Convert BTC to satoshis
        //                 console.log('Sending transaction:', { from: currentAccount, to: recipientAddress, amount: amountInSatoshis });

        //                 const createPsbtResult = await window.bitcoin.request({
        //                         method: 'bitcoin_createPsbt',
        //                         params: [currentAccount, recipientAddress, amountInSatoshis]
        //                 });

        //                 if (!createPsbtResult.success || typeof createPsbtResult.psbtHex !== 'string') {
        //                         throw new Error(createPsbtResult.error || 'Failed to create PSBT');
        //                 }

        //                 console.log('Created PSBT:', createPsbtResult.psbtHex);

        //                 const signPsbtResult = await window.bitcoin.request({
        //                         method: 'bitcoin_signPsbt',
        //                         params: [createPsbtResult.psbtHex]
        //                 });

        //                 if (!signPsbtResult.success || typeof signPsbtResult.signedPsbtHex !== 'string') {
        //                         throw new Error(signPsbtResult.error || 'Failed to sign PSBT');
        //                 }

        //                 console.log('Signed PSBT:', signPsbtResult.signedPsbtHex);

        //                 const broadcastResult = await window.bitcoin.request({
        //                         method: 'bitcoin_broadcastTransaction',
        //                         params: [signPsbtResult.signedPsbtHex]
        //                 });

        //                 console.log('Broadcast result:', broadcastResult);

        //                 if (!broadcastResult.success) {
        //                         throw new Error(broadcastResult.error || 'Failed to broadcast transaction');
        //                 }

        //                 transactionResult.textContent = `Transaction sent! TXID: ${broadcastResult.txid}`;
        //                 await updateBalance();
        //         } catch (error) {
        //                 console.error('Error sending transaction:', error);
        //                 transactionResult.textContent = `Error: ${error.message}`;
        //         }
        // }

        function initializeBitcoinProvider() {
                if (typeof window.bitcoin !== 'undefined') {
                        console.log('Bitcoin provider detected');
                        walletStatus.textContent = 'Wallet extension detected';
                        window.bitcoin.on('accountsChanged', (accounts) => {
                                console.log('Accounts changed:', accounts);
                                currentAccount = accounts[0];
                                walletAddress.textContent = `Address: ${currentAccount}`;
                                updateBalance();
                        });
                        connectWalletBtn.disabled = false;
                } else {
                        console.log('Bitcoin provider not detected');
                        walletStatus.textContent = 'Wallet extension not detected';
                        connectWalletBtn.disabled = true;
                }
        }

        async function generateTransferPsbt() {
                if (!currentAccount) {
                        alert('Please connect your wallet first');
                        return;
                }

                const recipientAddressElement = document.getElementById('psbt-recipient-address');
                const amountElement = document.getElementById('psbt-amount');

                if (!recipientAddressElement || !amountElement) {
                        console.error('Required DOM elements not found');
                        return;
                }

                const recipientAddress = recipientAddressElement.value.trim();
                const amount = parseInt(amountElement.value);

                if (!recipientAddress || isNaN(amount) || amount <= 0) {
                        alert('Please enter valid recipient address and amount');
                        return;
                }

                try {
                        const publicKey = await window.bitcoin.request({
                                method: 'derivePublicKey',
                                params: [currentAccount]
                        });

                        console.log('Retrieved public key:', publicKey);

                        // Convert the public key to a hex string if it's an object
                        const publicKeyHex = typeof publicKey === 'object' ?
                                Object.values(publicKey).map(v => v.toString(16).padStart(2, '0')).join('') :
                                publicKey;

                        const utxos = await window.bitcoin.request({
                                method: 'getPaymentUtxos',
                                params: [currentAccount]
                        });

                        console.log('Retrieved UTXOs:', utxos);

                        const processedUtxos = Object.values(utxos).filter(item => typeof item === 'object');
                        console.log('Processed UTXOs:', processedUtxos);

                        if (processedUtxos.length === 0) {
                                throw new Error('No UTXOs available for payment');
                        }

                        const walletProvider = 'test';

                        const response = await window.bitcoin.request({
                                method: 'generateTransferPsbt',
                                params: [{
                                        amount: amount,
                                        toAddress: recipientAddress,
                                        type: 'standard',
                                        user: {
                                                paymentAddress: currentAccount,
                                                paymentPublicKey: publicKeyHex,
                                                paymentUtxos: processedUtxos,
                                                walletProvider: walletProvider
                                        },
                                        isCustodial: false
                                }]
                        });

                        console.log('Generate PSBT response:', response);

                        if (response.success) {
                                document.getElementById('psbt-result').textContent = `Generated PSBT: ${response.psbt}`;
                                console.log('Indexes:', response.indexes);
                                console.log('Network Fee:', response.networkFee);
                        } else {
                                throw new Error(response.error || 'Failed to generate PSBT');
                        }
                } catch (error) {
                        console.error('Error generating PSBT:', error);
                        document.getElementById('psbt-result').textContent = `Error: ${error.message}`;
                }
        }

        // document.getElementById('generate-psbt-btn').addEventListener('click', generateTransferPsbt);

        connectWalletBtn.addEventListener('click', connectWallet);
        signMessageBtn.addEventListener('click', signMessage);
        ('click', signMessage);
        // sendTransactionBtn.addEventListener('click', sendTransaction);

        generatePsbtBtn.addEventListener('click', generateTransferPsbt);

        // Wait for the bitcoinProviderReady event
        window.addEventListener('bitcoinProviderReady', initializeBitcoinProvider, { once: true });

        // Fallback: If the event doesn't fire, check after a short delay
        setTimeout(() => {
                if (typeof window.bitcoin === 'undefined') {
                        console.log('Bitcoin provider not detected after timeout');
                        walletStatus.textContent = 'Wallet extension not detected (timeout)';
                        connectWalletBtn.disabled = true;
                }
        }, 2000);
});