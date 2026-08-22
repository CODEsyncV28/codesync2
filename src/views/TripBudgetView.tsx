import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  PieChart as PieChartIcon,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  Trash2,
  Calendar,
  Tag,
  ArrowLeft,
  CheckCircle2,
  Plane,
  Building2,
  Compass,
  Utensils,
  Receipt,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Trip, Expense, ExpenseCategory } from '../types';
import { tripService } from '../services/tripService';
import { useCurrency } from '../context/CurrencyContext';

const COLORS = ['#0284c7', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

interface TripBudgetViewProps {
  tripId: string;
  onNavigate: (screen: any, tripId?: string) => void;
}

export const TripBudgetView: React.FC<TripBudgetViewProps> = ({ tripId, onNavigate }) => {
  const { currencySymbol, formatPrice } = useCurrency();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  // Expense Logger form state
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [amount, setAmount] = useState<number>(50);
  const [category, setCategory] = useState<ExpenseCategory>('Food & Dining');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const loadTrip = async () => {
    setLoading(true);
    try {
      const data = await tripService.getTripById(tripId);
      setTrip(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Calculating financial breakdowns...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="py-16 text-center">
        <p className="text-base font-bold text-slate-800">Trip not found</p>
        <button
          onClick={() => onNavigate('my-trips')}
          className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold"
        >
          Back to My Trips
        </button>
      </div>
    );
  }

  const budgetSummary = tripService.calculateBudgetSummary(trip);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    const updated = await tripService.addExpense(trip.id, {
      category,
      amount: Number(amount),
      description: description.trim(),
      date,
    });
    setTrip(updated);
    setDescription('');
    setAmount(50);
    setShowAddExpense(false);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const updated = await tripService.deleteExpense(trip.id, expenseId);
    setTrip(updated);
  };

  // Pie chart data
  const pieData = Object.entries(budgetSummary.categoryBreakdown).map(([name, value]) => ({
    name,
    value,
  }));

  // Bar chart by city
  const cityBarData = (trip.stops || []).map((stop) => {
    const start = new Date(stop.start_date);
    const end = new Date(stop.end_date);
    const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
    const stay = nights * (stop.accommodation_cost_per_night || 0);
    const transport = Number(stop.transport_cost_to_stop || 0);
    const activities = (stop.activities || []).reduce((a, b) => a + (b.cost || 0), 0);

    return {
      cityName: stop.city_name,
      Accommodation: stay,
      Transport: transport,
      Activities: activities,
      total: stay + transport + activities,
    };
  });

  const isOverBudget = budgetSummary.isOverBudget;

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('itinerary-view', trip.id)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">
                Financial Management
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">{budgetSummary.totalDays} Days</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {trip.name} Budget & Cost Breakdown
            </h1>
          </div>
        </div>

        <button
          onClick={() => setShowAddExpense(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Log Actual Expense</span>
        </button>
      </div>

      {/* Budget Over Limit Alert */}
      {isOverBudget && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">Planned costs exceed your target budget</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              Your planned expenses of {formatPrice(budgetSummary.totalPlanned)} exceed your target budget of {formatPrice(budgetSummary.targetBudget)} by {formatPrice(Math.abs(budgetSummary.variance))}. Consider adjusting accommodations or activities in the builder.
            </p>
          </div>
        </div>
      )}

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Target Budget
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatPrice(budgetSummary.targetBudget)}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">Original Goal</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Planned Itinerary
          </p>
          <p className="text-2xl font-black text-sky-600 mt-1">
            {formatPrice(budgetSummary.totalPlanned)}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">Stays, Travel, Acts</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Logged Expenses
          </p>
          <p className="text-2xl font-black text-indigo-600 mt-1">
            {formatPrice(budgetSummary.totalLoggedExpenses)}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">
            {trip.expenses?.length || 0} Transactions
          </span>
        </div>

        <div
          className={`p-5 rounded-3xl border shadow-sm ${
            budgetSummary.variance >= 0
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-rose-50/70 border-rose-200'
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {budgetSummary.variance >= 0 ? 'Remaining Buffer' : 'Over Budget'}
          </p>
          <p
            className={`text-2xl font-black mt-1 ${
              budgetSummary.variance >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatPrice(Math.abs(budgetSummary.variance))}
          </p>
          <span className="text-[11px] font-semibold text-slate-600">
            Avg: {formatPrice(budgetSummary.dailyAverage)}/day
          </span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Donut */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-sky-600" /> Planned Spend by Category
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribution across accommodations, transit, and activities
            </p>
          </div>

          <div className="h-64 w-full my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatPrice(Number(value)), 'Amount']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
            {pieData.map((item, idx) => (
              <div key={item.name} className="p-2 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block truncate">
                  {item.name}
                </span>
                <span className="font-extrabold text-slate-900">{formatPrice(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Per City Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" /> Cost by Destination City
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare budget footprint across each stop on the route
            </p>
          </div>

          <div className="h-64 w-full my-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityBarData}>
                <XAxis dataKey="cityName" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip formatter={(value: any) => [formatPrice(Number(value)), 'Cost']} />
                <Legend />
                <Bar dataKey="Accommodation" stackId="a" fill="#0284c7" />
                <Bar dataKey="Transport" stackId="a" fill="#6366f1" />
                <Bar dataKey="Activities" stackId="a" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
            Accommodations and transport form the bulk of the expenditure.
          </div>
        </div>
      </div>

      {/* Logged Expense Transactions */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" /> Logged Real-Time Expenses
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Record receipts, meals, coffee, local tickets, and gifts while traveling
            </p>
          </div>

          <button
            onClick={() => setShowAddExpense(true)}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Add Expense
          </button>
        </div>

        {(!trip.expenses || trip.expenses.length === 0) ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500">
              No live expenses logged yet. Keep track of real-world receipts on the go.
            </p>
            <button
              onClick={() => setShowAddExpense(true)}
              className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
            >
              + Record first expense
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {trip.expenses.map((exp) => (
              <div key={exp.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    {currencySymbol}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{exp.description}</p>
                    <p className="text-slate-400 text-[11px]">
                      {exp.date} • <span className="font-semibold text-slate-600">{exp.category}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="font-extrabold text-sm text-slate-900">
                    {formatPrice(exp.amount)}
                  </span>
                  <button
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="p-1 text-slate-300 hover:text-rose-600 rounded cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Record Live Expense</h3>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Cafe espresso & croissant, metro day pass, museum audio guide..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Amount ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 bg-white"
                >
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Accommodation">Accommodation</option>
                  <option value="Activities & Tours">Activities & Tours</option>
                  <option value="Shopping & Souvenirs">Shopping & Souvenirs</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
