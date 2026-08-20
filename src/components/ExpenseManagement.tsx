import React, { useState } from 'react';
import { Expense, Agent, UserRole, PaymentMode } from '../types';
import { supabaseService } from '../lib/supabaseService';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { 
  Receipt, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  Calendar, 
  UserCheck, 
  X,
  Filter,
  DollarSign
} from 'lucide-react';

interface ExpenseManagementProps {
  expenses: Expense[];
  agents: Agent[];
  userRole: UserRole;
  onRefresh: () => void;
}

export function ExpenseManagement({ expenses, agents, userRole, onRefresh }: ExpenseManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [category, setCategory] = useState('Office Supplies');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [agentId, setAgentId] = useState('');

  const openAddModal = () => {
    setSelectedExpense(null);
    setCategory('Office Supplies');
    setDescription('');
    setAmount(0);
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('Cash');
    setAgentId(agents[0]?.id || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setSelectedExpense(exp);
    setCategory(exp.category);
    setDescription(exp.description);
    setAmount(exp.amount);
    setDate(exp.date);
    setPaymentMode(exp.payment_mode);
    setAgentId(exp.agent_id || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openViewModal = (exp: Expense) => {
    setSelectedExpense(exp);
    setIsViewOpen(true);
  };

  const openDeleteModal = (exp: Expense) => {
    setSelectedExpense(exp);
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!description.trim() || amount <= 0) {
      setFormError('Description and positive Amount are required.');
      return;
    }

    try {
      setLoading(true);
      if (selectedExpense) {
        await supabaseService.updateExpense(selectedExpense.id, {
          category,
          description,
          amount,
          date,
          payment_mode: paymentMode,
          agent_id: agentId || null
        });
      } else {
        await supabaseService.createExpense({
          category,
          description,
          amount,
          date,
          payment_mode: paymentMode,
          agent_id: agentId || null
        });
      }
      setIsFormOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save expense.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async (reason: string) => {
    if (!selectedExpense) return;
    try {
      await supabaseService.deleteExpense(selectedExpense.id, reason, 'admin');
      setIsDeleteOpen(false);
      onRefresh();
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete expense.');
      throw err;
    }
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    const matchesAgent = agentFilter === 'all' || e.agent_id === agentFilter;

    return matchesSearch && matchesCategory && matchesAgent;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-900">Agency Expenses</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Log operational expenses, commissions, and utility bills associated with agents.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg">
            <div className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">Filtered Total</div>
            <div className="text-sm font-black text-rose-700">₹{totalExpenseAmount.toLocaleString('en-IN')}</div>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search expense description or category..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Agent:</span>
          </div>
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All Agents</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>
                {a.full_name} ({a.agent_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Assigned Agent</th>
                <th className="py-3 px-4 font-bold text-right">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exp.date}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-medium max-w-xs truncate">
                      {exp.description}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{exp.payment_mode}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5 text-slate-700">
                        <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                        <span>{exp.agent_name || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-700">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          onClick={() => openViewModal(exp)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(exp)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(exp)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {selectedExpense ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Office / Utilities / Commission"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Monthly Internet Bill / Office Printing"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Agent</label>
                <select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Unassigned</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.full_name} ({a.agent_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
                >
                  {loading ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {isViewOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Expense Details</h3>
              <button onClick={() => setIsViewOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs">
              <div><span className="font-bold text-sm text-rose-700">₹{selectedExpense.amount.toLocaleString('en-IN')}</span></div>
              <div><span className="font-semibold text-slate-700">Description:</span> {selectedExpense.description}</div>
              <div><span className="font-semibold text-slate-700">Category:</span> {selectedExpense.category}</div>
              <div><span className="font-semibold text-slate-700">Mode:</span> {selectedExpense.payment_mode}</div>
              <div><span className="font-semibold text-slate-700">Date:</span> {selectedExpense.date}</div>
              <div><span className="font-semibold text-slate-700">Agent:</span> {selectedExpense.agent_name} ({selectedExpense.agent_code})</div>

              <div className="pt-3 text-right">
                <button
                  onClick={() => setIsViewOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense"
        itemName={selectedExpense?.description || 'Expense'}
        userRole={userRole}
        errorMessage={deleteError}
      />
    </div>
  );
}
