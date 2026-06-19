import React, { useState } from 'react';
import { CreditCard, ShieldCheck, Smartphone, History, Car, ChevronRight, Wallet } from '../../utils/icons';
import { api } from '../../services/authService';

const ClientWallet = ({
  user,
  walletBalance,
  transactions,
  upiId,
  upiInput,
  setUpiInput,
  handleLinkUpi,
  getFilteredTransactions,
  searchQuery,
  updateUser,
  onBalanceUpdate
}) => {
  const [depositing, setDepositing] = useState(false);

  const handleAddMoney = async () => {
    const amountStr = prompt("Enter the amount you would like to top up (INR):");
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive number.");
      return;
    }

    setDepositing(true);
    try {
      // 1. Create deposit order in backend
      const response = await api.post('/payment/wallet/deposit', { amount });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to initiate deposit.');
      }

      const { razorpayOrder } = response.data;

      // Check if Razorpay script is loaded
      if (!window.Razorpay) {
        alert('Razorpay SDK is loading, please try again in a few seconds.');
        setDepositing(false);
        return;
      }

      // 2. Open Razorpay checkout
      const options = {
        key: razorpayOrder.key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'DMS Cab Services',
        description: `Wallet Deposit: ₹${amount.toLocaleString()}`,
        order_id: razorpayOrder.id,
        handler: async (paymentResponse) => {
          try {
            setDepositing(true);
            // Verify payment
            const verifyResponse = await api.post('/payment/wallet/verify', {
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_signature: paymentResponse.razorpay_signature
            });

            if (verifyResponse.data.success) {
              alert(`Successfully deposited ₹${amount.toLocaleString()} to your wallet!`);
              // Update local state / user info
              if (verifyResponse.data.user) {
                updateUser(verifyResponse.data.user);
              }
              if (onBalanceUpdate) {
                onBalanceUpdate(verifyResponse.data.walletBalance);
              }
            }
          } catch (verifyError) {
            console.error('Wallet verification failed:', verifyError);
            alert(verifyError.response?.data?.message || 'Deposit verification failed.');
          } finally {
            setDepositing(false);
          }
        },
        prefill: {
          name: user.fullName || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: {
          color: '#003893'
        },
        modal: {
          ondismiss: () => {
            setDepositing(false);
            alert('Deposit transaction cancelled.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Deposit initiation failed:', err);
      alert(err.response?.data?.message || err.message || 'Deposit failed.');
      setDepositing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      {/* Left Side: Balance card, credit card, transaction history */}
      <div className="lg:col-span-8 space-y-6">
        <h2 className="text-2xl font-serif font-bold text-slate-800">Wallet Dashboard</h2>

        {/* Balance card */}
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Available Balance</span>
            <div className="flex items-center space-x-2 mt-2">
              <h3 className="text-3xl font-serif text-slate-800 font-bold">₹{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <span className="bg-emerald-100 border border-emerald-200 text-emerald-600 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full">Secured</span>
            </div>
          </div>

          <div className="flex space-x-3 w-full sm:w-auto">
            <button
              id="wallet-add-money-btn"
              onClick={handleAddMoney}
              disabled={depositing}
              className="flex-1 sm:flex-initial bg-[#003893] hover:bg-[#002d72] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md"
            >
              {depositing ? 'Processing...' : '+ Add Money'}
            </button>
            <button onClick={() => alert('Transfer functionality is coming soon!')} className="flex-1 sm:flex-initial bg-transparent border border-slate-200 hover:bg-slate-100 text-slate-800 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all">Transfer</button>
          </div>
        </div>

        {/* Credit card design */}
        <div className="bg-gradient-to-br from-[#003893] to-[#002d72] border border-[#003893]/20 rounded-2xl p-6 relative overflow-hidden h-48 flex flex-col justify-between max-w-sm shadow-md">
          <div className="flex justify-between items-start">
            <div className="text-[10px] text-white/80 uppercase tracking-widest font-mono">DMS CAB SERVICES</div>
            <div className="w-8 h-6 bg-yellow-500/20 rounded border border-yellow-500/30" />
          </div>
          <div className="text-lg font-mono text-white tracking-widest font-bold">•••• •••• •••• 8842</div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[8px] text-white/50 uppercase">Card Holder</p>
              <p className="text-xs text-white font-medium">{user.fullName || 'Pritam Mondal'}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-white/50 uppercase">Expires</p>
              <p className="text-xs text-white font-mono">12/28</p>
            </div>
          </div>
        </div>

        {/* Transaction history list */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Transaction History</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-left">
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Reference</th>
                  <th className="pb-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {getFilteredTransactions().length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-slate-400">
                      {searchQuery ? `No transactions match: "${searchQuery}"` : 'No transactions recorded yet.'}
                    </td>
                  </tr>
                ) : (
                  getFilteredTransactions().map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-100/50 transition-colors">
                      <td className="py-3.5 font-medium text-slate-800">{t.type}</td>
                      <td className="py-3.5 text-slate-400">{t.date}</td>
                      <td className="py-3.5 font-mono text-slate-400 truncate max-w-[150px]">{t.desc}</td>
                      <td className={`py-3.5 font-bold text-right ${t.minus ? 'text-red-500' : 'text-emerald-600'}`}>{t.amt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Side: rewards, link upi, security */}
      <div className="lg:col-span-4 space-y-6">
        {/* Linked UPI ID */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Link UPI ID</h4>
          <div className="flex space-x-2">
            <input
              id="wallet-upi-input"
              type="text"
              placeholder="alex.rivera@upi"
              value={upiInput}
              onChange={(e) => setUpiInput(e.target.value)}
              className="flex-1 bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-800"
            />
            <button id="wallet-upi-link-btn" onClick={handleLinkUpi} className="bg-[#003893] hover:bg-[#002d72] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm">Link</button>
          </div>
          {upiId && (
            <p className="text-[10px] text-emerald-600 font-semibold">Active: {upiId}</p>
          )}
        </div>

        {/* Trust & Security info */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Trust & Security</h4>
          <p className="text-[10px] text-slate-400 leading-relaxed font-sans">Your credit card data is encrypted using military-grade AES-256 standard protocols. DMS Cab Services never stores CVV code records on its servers.</p>
        </div>
      </div>
    </div>
  );
};

export default ClientWallet;
