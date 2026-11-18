import React, { useState, useEffect, useRef } from 'react';
import { retailerApi } from '../api';
import { CustomerLookupResult } from '../types';
import { 
  Search, 
  User, 
  Mail, 
  Phone, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Sparkles, 
  X, 
  History, 
  AlertTriangle,
  Receipt,
  UserCheck
} from 'lucide-react';

interface CustomerLookupInputProps {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onCustomerNameChange: (value: string) => void;
  onCustomerEmailChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
  onCustomerSelected?: (customer: CustomerLookupResult) => void;
}

export const CustomerLookupInput: React.FC<CustomerLookupInputProps> = ({
  customerName,
  customerEmail,
  customerPhone,
  onCustomerNameChange,
  onCustomerEmailChange,
  onCustomerPhoneChange,
  onCustomerSelected,
}) => {
  const [lookupQuery, setLookupQuery] = useState('');
  const [results, setResults] = useState<CustomerLookupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLookupResult | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!dropdownOpen && !lookupQuery.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await retailerApi.lookupCustomers(lookupQuery.trim());
        setResults(data || []);
      } catch (err) {
        console.error('Customer lookup error', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [lookupQuery, dropdownOpen]);

  const handleSelectCustomer = (cust: CustomerLookupResult) => {
    setSelectedCustomer(cust);
    onCustomerNameChange(cust.name || '');
    onCustomerEmailChange(cust.email || '');
    onCustomerPhoneChange(cust.phone || '');
    setLookupQuery('');
    setDropdownOpen(false);
    if (onCustomerSelected) {
      onCustomerSelected(cust);
    }
  };

  const handleClearSelection = () => {
    setSelectedCustomer(null);
    setLookupQuery('');
    // Optionally leave values or let user edit
  };

  const handleResetAll = () => {
    setSelectedCustomer(null);
    setLookupQuery('');
    onCustomerNameChange('');
    onCustomerEmailChange('');
    onCustomerPhoneChange('');
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Search and Quick Lookup Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-indigo-500" />
          Customer Information
        </label>
        {selectedCustomer ? (
          <button
            type="button"
            onClick={handleResetAll}
            className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3 h-3" /> Clear Customer
          </button>
        ) : (
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Auto-lookup by phone or email
          </span>
        )}
      </div>

      {/* Auto-fill indicator banner if selected */}
      {selectedCustomer && (
        <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-2 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {selectedCustomer.name?.slice(0, 2).toUpperCase() || 'CU'}
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {selectedCustomer.name}
                  </span>
                  {selectedCustomer.isRegistered && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <UserCheck className="w-2.5 h-2.5" /> Registered
                    </span>
                  )}
                  {selectedCustomer.accountStatus === 'SUSPENDED' && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      <ShieldAlert className="w-2.5 h-2.5" /> Suspended
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span>{selectedCustomer.email}</span>
                  {selectedCustomer.phone && <span>&bull; {selectedCustomer.phone}</span>}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearSelection}
              className="text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
              title="Change Customer"
            >
              Change
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-indigo-700 dark:text-indigo-300 pt-1 border-t border-indigo-100 dark:border-indigo-900/50 flex-wrap">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> Auto-filled customer record
            </span>
            {selectedCustomer.totalWarranties > 0 && (
              <span>&bull; {selectedCustomer.totalWarranties} total warranties</span>
            )}
            {selectedCustomer.previousPurchasesWithRetailer > 0 && (
              <span>&bull; {selectedCustomer.previousPurchasesWithRetailer} purchases at your store</span>
            )}
            {selectedCustomer.lastPurchaseDate && (
              <span>&bull; Last visited: {selectedCustomer.lastPurchaseDate}</span>
            )}
          </div>

          {selectedCustomer.accountStatus === 'SUSPENDED' && (
            <div className="p-2 bg-rose-100/70 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg text-[11px] text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Notice: This customer account is currently suspended by administration.</span>
            </div>
          )}
        </div>
      )}

      {/* Customer Lookup Search Box */}
      {!selectedCustomer && (
        <div className="relative">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={lookupQuery}
              onFocus={() => setDropdownOpen(true)}
              onChange={(e) => {
                setLookupQuery(e.target.value);
                setDropdownOpen(true);
              }}
              placeholder="Search existing customer by phone, email, or name..."
              className="w-full pl-9 pr-8 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition shadow-2xs"
            />
            {lookupQuery && (
              <button
                type="button"
                onClick={() => setLookupQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                  Searching customer directory...
                </div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center space-y-1">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No customer records matched "{lookupQuery}"
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    Fill in details below to register a new customer profile.
                  </div>
                </div>
              ) : (
                <>
                  <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                    <span>Matching Customer Accounts</span>
                    <span>Click to auto-fill</span>
                  </div>
                  {results.map((c) => (
                    <div
                      key={c.email || c.phone || c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="p-3 hover:bg-indigo-50/70 dark:hover:bg-slate-800/80 cursor-pointer transition flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {c.name ? c.name.slice(0, 2).toUpperCase() : 'CU'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                              {c.name || 'Unnamed Customer'}
                            </span>
                            {c.isRegistered ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Verified Account
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                <History className="w-2.5 h-2.5" /> Previous Customer
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 truncate">
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {c.email || 'No email on record'}
                            </span>
                            {c.phone && (
                              <span className="flex items-center gap-1 shrink-0">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {c.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                          <Sparkles className="w-3 h-3" /> Auto-Fill
                        </span>
                        {c.previousPurchasesWithRetailer > 0 && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            {c.previousPurchasesWithRetailer} store sale{c.previousPurchasesWithRetailer > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Manual Editable Fields */}
      <div className="space-y-2">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Customer Full Name
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder="e.g. John Doe"
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Customer Email Address
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => onCustomerEmailChange(e.target.value)}
              placeholder="e.g. customer@example.com"
              className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => onCustomerPhoneChange(e.target.value)}
              placeholder="e.g. +1 (555) 000-0000"
              className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
