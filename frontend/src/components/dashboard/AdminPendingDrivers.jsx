import React from 'react';
import {
  AlertTriangle, Clock, CheckCircle, Eye, XCircle
} from '../../utils/icons';

const MaskedAadhaar = ({ aadhaar, driverId }) => {
  const [revealed, setRevealed] = React.useState(false);
  if (!aadhaar) return <span>N/A</span>;
  
  const handleReveal = () => {
    setRevealed(!revealed);
    if (!revealed) {
      console.log(`[AUDIT LOG] Admin revealed Aadhaar number for driver ID: ${driverId}`);
    }
  };

  const cleanAadhaar = aadhaar.replace(/\s|-/g, '');
  const last4 = cleanAadhaar.slice(-4);
  const masked = `XXXX-XXXX-${last4}`;
  
  return (
    <span className="inline-flex items-center space-x-1.5">
      <span className="font-semibold font-mono text-slate-900">{revealed ? aadhaar : masked}</span>
      <button 
        type="button" 
        onClick={handleReveal} 
        className="text-[10px] text-[#003893] hover:underline focus:outline-none ml-1 cursor-pointer font-bold uppercase tracking-wider"
      >
        {revealed ? 'Hide' : 'Reveal'}
      </button>
    </span>
  );
};

const AdminPendingDrivers = ({
  drivers,
  loading,
  handleApprove,
  handleReject,
  setSelectedDoc
}) => {
  return (
    <div className="mt-6 bg-[#FDE77B] border-2 border-[#003893]/20 rounded-2xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle size={20} className="text-[#003893]" />
          <h2 className="text-lg font-serif text-[#003893] font-bold">Pending Chauffeur Approvals</h2>
          <span className="text-xs bg-[#003893] text-white px-2.5 py-0.5 rounded-full font-bold shadow-sm">
            {drivers.length}
          </span>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-12 text-slate-800">
          <Clock className="mx-auto mb-3 animate-spin text-[#003893]" size={28} />
          <p className="font-semibold">Loading application data...</p>
        </div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-12 text-slate-800">
          <CheckCircle className="mx-auto mb-3 text-emerald-600" size={32} />
          <p className="font-semibold">All driver applications are processed. No pending approvals!</p>
        </div>
      ) : (
        <div>
          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[700px] lg:min-w-0">
              <thead>
                <tr className="border-b-2 border-[#003893]/25">
                  <th className="text-left text-xs text-[#003893] uppercase tracking-wider pb-3 font-bold">Chauffeur</th>
                  <th className="text-left text-xs text-[#003893] uppercase tracking-wider pb-3 font-bold">Contact</th>
                  <th className="text-left text-xs text-[#003893] uppercase tracking-wider pb-3 font-bold">Driver & Vehicle Details</th>
                  <th className="text-left text-xs text-[#003893] uppercase tracking-wider pb-3 font-bold">Attached Documents</th>
                  <th className="text-right text-xs text-[#003893] uppercase tracking-wider pb-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drivers.map((driver) => (
                  <tr key={driver._id} className="hover:bg-[#003893]/5 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#003893] flex items-center justify-center text-white text-sm font-semibold shadow-sm animate-none">
                          {driver.fullName.charAt(0)}
                        </div>
                        <span className="text-sm text-slate-900 font-bold">{driver.fullName}</span>
                      </div>
                    </td>
                    <td className="py-4 text-left">
                      <p className="text-sm text-slate-900 font-medium">{driver.email}</p>
                      <p className="text-xs text-slate-700 font-medium">{driver.phone}</p>
                    </td>
                    <td className="py-4 text-left">
                      <div className="space-y-1 text-xs text-slate-800">
                        <p><strong className="text-slate-500 font-medium">Car Number:</strong> <span className="font-semibold font-mono text-slate-900">{driver.vehicleNumber}</span></p>
                        <p><strong className="text-slate-500 font-medium">Model & Year:</strong> <span className="font-semibold text-slate-900">{driver.vehicleModelYear || 'N/A'}</span></p>
                        <p><strong className="text-slate-500 font-medium">License No:</strong> <span className="font-semibold font-mono text-slate-900">{driver.licenseNumber}</span></p>
                        <p><strong className="text-slate-500 font-medium">City:</strong> <span className="font-semibold text-slate-900">{driver.currentCity || 'N/A'}</span></p>
                        <p><strong className="text-slate-500 font-medium">Aadhaar:</strong> <MaskedAadhaar aadhaar={driver.aadhaarNumber} driverId={driver._id} /></p>
                        {driver.driverNameIfVendor && <p><strong className="text-slate-500 font-medium">Driver (Vendor):</strong> <span className="font-semibold text-slate-900">{driver.driverNameIfVendor}</span></p>}
                        {driver.driverContactNumber && <p><strong className="text-slate-500 font-medium">Driver Contact:</strong> <span className="font-semibold text-slate-900">{driver.driverContactNumber}</span></p>}
                        <p><strong className="text-slate-500 font-medium">RC Available:</strong> <span className="font-semibold text-slate-900">{driver.rcCopyAvailable || 'No'}</span></p>
                        <p><strong className="text-slate-500 font-medium">Insurance Till:</strong> <span className="font-semibold text-slate-900">{driver.insuranceValidTill || 'N/A'}</span></p>
                        <p><strong className="text-slate-500 font-medium">Preferred Area:</strong> <span className="font-semibold text-slate-900">{driver.preferredServiceArea || 'N/A'}</span></p>
                        {driver.previousExperience && <p><strong className="text-slate-500 font-medium">Experience:</strong> <span className="font-semibold text-slate-900">{driver.previousExperience}</span></p>}
                      </div>
                    </td>
                    <td className="py-4 font-left">
                      <div className="flex flex-col space-y-2 items-start justify-start">
                        {driver.rcDocument && (
                          <button
                            onClick={() => setSelectedDoc({
                              docData: driver.rcDocument,
                              docTitle: 'RC Document (Vehicle Registration)',
                              driverName: driver.fullName
                            })}
                            className="flex items-center space-x-1.5 text-xs bg-white border border-[#003893]/40 text-[#003893] hover:bg-[#003893] hover:text-white px-2.5 py-1.5 rounded-lg transition-all duration-200 font-semibold shadow-xs cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>View RC Copy</span>
                          </button>
                        )}
                        {driver.licenseDocument && (
                          <button
                            onClick={() => setSelectedDoc({
                              docData: driver.licenseDocument,
                              docTitle: 'Chauffeur Driving License',
                              driverName: driver.fullName
                            })}
                            className="flex items-center space-x-1.5 text-xs bg-white border border-[#003893]/40 text-[#003893] hover:bg-[#003893] hover:text-white px-2.5 py-1.5 rounded-lg transition-all duration-200 font-semibold shadow-xs cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>View License</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleApprove(driver._id)}
                          className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all shadow-sm border-none cursor-pointer flex items-center justify-center"
                          title="Approve Driver Application"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => handleReject(driver._id)}
                          className="p-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-sm border-none cursor-pointer flex items-center justify-center"
                          title="Reject Driver Application"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden space-y-4 text-left">
            {drivers.map((driver) => (
              <div key={driver._id} className="bg-white border border-[#003893]/15 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#003893] flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                    {driver.fullName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{driver.fullName}</h4>
                    <span className="text-[10px] text-slate-500 font-medium">ID: {driver._id.substring(18)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] text-[#003893] uppercase tracking-wider mb-0.5 font-bold">Contact</p>
                    <p className="text-xs text-slate-900 font-medium break-all">{driver.email}</p>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">{driver.phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#003893] uppercase tracking-wider mb-0.5 font-bold">Credentials & Details</p>
                    <div className="space-y-1 text-[11px] text-slate-800">
                      <p><strong className="text-slate-500 font-medium">Car:</strong> <span className="font-semibold font-mono">{driver.vehicleNumber}</span></p>
                      <p><strong className="text-slate-500 font-medium">Model:</strong> <span className="font-semibold">{driver.vehicleModelYear || 'N/A'}</span></p>
                      <p><strong className="text-slate-500 font-medium">License:</strong> <span className="font-semibold font-mono">{driver.licenseNumber}</span></p>
                      <p><strong className="text-slate-500 font-medium">City:</strong> <span className="font-semibold">{driver.currentCity || 'N/A'}</span></p>
                      <p><strong className="text-slate-500 font-medium">Aadhaar:</strong> <MaskedAadhaar aadhaar={driver.aadhaarNumber} driverId={driver._id} /></p>
                      {driver.driverNameIfVendor && <p><strong className="text-slate-500 font-medium">Driver (Vendor):</strong> <span className="font-semibold">{driver.driverNameIfVendor}</span></p>}
                      {driver.driverContactNumber && <p><strong className="text-slate-500 font-medium">Driver Phone:</strong> <span className="font-semibold">{driver.driverContactNumber}</span></p>}
                      <p><strong className="text-slate-500 font-medium">RC Available:</strong> <span className="font-semibold">{driver.rcCopyAvailable || 'No'}</span></p>
                      <p><strong className="text-slate-500 font-medium">Insurance Till:</strong> <span className="font-semibold">{driver.insuranceValidTill || 'N/A'}</span></p>
                      <p><strong className="text-slate-500 font-medium">Preferred Area:</strong> <span className="font-semibold">{driver.preferredServiceArea || 'N/A'}</span></p>
                      {driver.previousExperience && <p><strong className="text-slate-500 font-medium">Experience:</strong> <span className="font-semibold">{driver.previousExperience}</span></p>}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] text-[#003893] uppercase tracking-wider mb-2 font-bold">Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {driver.rcDocument && (
                      <button
                        onClick={() => setSelectedDoc({
                          docData: driver.rcDocument,
                          docTitle: 'RC Document (Vehicle Registration)',
                          driverName: driver.fullName
                        })}
                        className="flex items-center space-x-1 text-[11px] bg-white border border-[#003893]/30 text-[#003893] hover:bg-[#003893] hover:text-white px-2.5 py-1.5 rounded-lg transition-all duration-200 font-semibold shadow-xs cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>RC Copy</span>
                      </button>
                    )}
                    {driver.licenseDocument && (
                      <button
                        onClick={() => setSelectedDoc({
                          docData: driver.licenseDocument,
                          docTitle: 'Chauffeur Driving License',
                          driverName: driver.fullName
                        })}
                        className="flex items-center space-x-1 text-[11px] bg-white border border-[#003893]/30 text-[#003893] hover:bg-[#003893] hover:text-white px-2.5 py-1.5 rounded-lg transition-all duration-200 font-semibold shadow-xs cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>License</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleReject(driver._id)}
                    className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center justify-center space-x-1 transition-all shadow-sm cursor-pointer"
                  >
                    <XCircle size={14} />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleApprove(driver._id)}
                    className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center space-x-1 transition-all shadow-sm cursor-pointer"
                  >
                    <CheckCircle size={14} />
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPendingDrivers;
