
import React from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';

// Standardized Spacing: 8px grid (p-2, p-4, p-6, p-8)
// Responsive Adjustments for Mobile

// --- BUTTONS ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', size = 'md', loading, icon: Icon, className = '', type = "button", ...props 
}) => {
  const base = "inline-flex items-center justify-center font-bold tracking-tight transition-all active:scale-[0.98] whitespace-nowrap overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed select-none border";
  
  const variants = {
    primary: "bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm hover:brightness-105 hover:shadow-indigo-500/20",
    ghost: "bg-transparent border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card-muted)] hover:text-[var(--text-primary)]",
    outline: "bg-transparent border-[var(--border-ui)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
    danger: "bg-rose-600 text-white border-rose-600 hover:bg-rose-500",
    success: "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500",
  };

  const sizes = {
    sm: "px-3 h-9 text-[11px] rounded-xl",
    md: "px-5 h-11 text-sm rounded-xl",
    lg: "px-8 h-12 lg:h-14 text-sm rounded-2xl",
    icon: "w-11 h-11 rounded-xl",
  };

  return (
    <button type={type} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : (
        <>
          {Icon && <Icon size={size === 'sm' ? 14 : 18} className={`${children ? 'mr-2' : ''}`} />}
          {children}
        </>
      )}
    </button>
  );
};

// --- CARDS ---
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: string;
  variant?: 'default' | 'muted' | 'accent';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  children, className = '', hover = true, padding = 'p-5 sm:p-6 lg:p-8', variant = 'default', ...props 
}) => {
  const variants = {
    default: "bg-[var(--bg-card)] border-[var(--border-ui)] shadow-sm",
    muted: "bg-[var(--bg-card-muted)] border-[var(--border-ui)]",
    accent: "bg-[var(--bg-card)] border-[var(--accent)]/30 shadow-lg shadow-indigo-500/5",
  };

  return (
    <div 
      className={`
        border rounded-[2rem]
        ${padding}
        ${variants[variant]}
        ${hover ? 'hover:border-[var(--accent)]/40 hover:shadow-md transition-all duration-200' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

// --- TYPOGRAPHY ---
export interface HeadingProps {
  children: React.ReactNode;
  className?: string;
  sub?: string;
}

export const Heading: React.FC<HeadingProps> = ({ children, className = "", sub }) => (
  <div className={`space-y-1 ${className}`}>
    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter text-[var(--text-primary)] uppercase leading-[1.1]">{children}</h2>
    {sub && <p className="text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)] opacity-50">{sub}</p>}
  </div>
);

export interface LabelProps {
  children: React.ReactNode;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({ children, className = "" }) => (
  <label className={`block text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] ml-1 opacity-60 ${className}`}>
    {children}
  </label>
);

// --- INPUTS ---
const sharedInputStyles = "w-full bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-2xl px-4 lg:px-6 text-sm font-semibold outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/5 transition-all placeholder:text-slate-500 placeholder:opacity-30 leading-relaxed";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  rightIcon?: LucideIcon;
  onRightIconClick?: () => void;
}

export const Input: React.FC<InputProps> = ({ label, error, icon: Icon, rightIcon: RightIcon, onRightIconClick, className = '', ...props }) => (
  <div className="w-full space-y-2">
    {label && <Label>{label}</Label>}
    <div className="relative">
      {Icon && <Icon size={16} className="absolute left-4 lg:left-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />}
      <input 
        className={`${sharedInputStyles} h-11 lg:h-12 ${Icon ? 'pl-11 lg:pl-12' : ''} ${RightIcon ? 'pr-11 lg:pr-12' : ''} ${error ? 'border-rose-500 ring-4 ring-rose-500/5' : ''} ${className}`} 
        {...props} 
      />
      {RightIcon && (
        <button 
          type="button" 
          onClick={onRightIconClick} 
          disabled={!onRightIconClick}
          className={`absolute right-4 lg:right-5 top-1/2 -translate-y-1/2 ${onRightIconClick ? 'text-[var(--accent)] hover:scale-110 active:scale-95 cursor-pointer' : 'text-slate-500 pointer-events-none'} transition-all`}
        >
          <RightIcon size={16} />
        </button>
      )}
    </div>
    {error && <p className="text-[10px] font-bold text-rose-500 ml-1 uppercase tracking-widest">{error}</p>}
  </div>
);

export interface PriceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  currency?: string;
  compact?: boolean;
}

export const PriceInput: React.FC<PriceInputProps> = ({ label, currency = 'AED', compact = false, className = '', onFocus, ...props }) => (
  <div className={`w-full ${compact ? '' : 'space-y-2'}`}>
    {label && <Label>{label}</Label>}
    <div className="relative group">
      <div className="absolute left-4 lg:left-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500 pointer-events-none opacity-40 group-focus-within:opacity-100 group-focus-within:text-[var(--accent)] transition-all">
        {currency}
      </div>
      <input 
        type="number"
        step="0.01"
        min="0"
        onFocus={(e) => {
          e.target.select();
          if (onFocus) onFocus(e);
        }}
        className={`${sharedInputStyles} ${compact ? 'h-9 px-3 pl-11' : 'h-11 lg:h-12 px-4 lg:px-6 pl-12 lg:pl-14'} font-bold tabular-nums tracking-tight ${className}`} 
        {...props} 
      />
    </div>
  </div>
);

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ label, error, children, className = '', ...props }) => (
  <div className="w-full space-y-2">
    {label && <Label>{label}</Label>}
    <div className="relative">
      <select 
        className={`${sharedInputStyles} h-11 lg:h-12 appearance-none cursor-pointer pr-10 lg:pr-12 ${error ? 'border-rose-500 ring-4 ring-rose-500/5' : ''} ${className}`} 
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-4 lg:right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
    {error && <p className="text-[10px] font-bold text-rose-500 ml-1 uppercase tracking-widest">{error}</p>}
  </div>
);

// --- BADGES ---
export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const themes = {
    default: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    info: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  };
  return (
    <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-wider border ${themes[variant]} ${className}`}>
      {children}
    </span>
  );
};

// --- EMPTY STATE ---
export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  variant?: 'default' | 'minimal' | 'large';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  variant = 'default',
  className = ''
}) => {
  const variants = {
    default: (
      <Card className={`p-8 sm:p-12 lg:p-16 text-center border-dashed border-2 flex flex-col items-center justify-center space-y-4 sm:space-y-6 ${className}`} hover={false}>
        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-3xl bg-[var(--bg-card-muted)] flex items-center justify-center text-[var(--accent)] opacity-70">
          <Icon size={variant === 'large' ? 48 : 32} strokeWidth={1.5} />
        </div>
        <div className="max-w-md space-y-2 sm:space-y-3">
          <h4 className="text-lg sm:text-xl lg:text-2xl font-black uppercase tracking-tight text-[var(--text-primary)] leading-snug">{title}</h4>
          <p className="text-xs sm:text-sm lg:text-base font-medium text-[var(--text-secondary)] leading-relaxed px-2">{description}</p>
        </div>
        {action && <div className="pt-4 sm:pt-6 w-full sm:w-auto">{action}</div>}
      </Card>
    ),
    minimal: (
      <div className={`flex flex-col items-center justify-center py-8 sm:py-12 space-y-3 sm:space-y-4 ${className}`}>
        <Icon size={24} className="text-[var(--text-secondary)] opacity-50" strokeWidth={1.5} />
        <div className="text-center space-y-1">
          <h4 className="text-sm sm:text-base font-black uppercase tracking-tight text-[var(--text-primary)]">{title}</h4>
          <p className="text-xs font-medium text-[var(--text-secondary)] opacity-70">{description}</p>
        </div>
        {action && <div className="pt-2">{action}</div>}
      </div>
    ),
    large: (
      <Card className={`p-12 sm:p-16 lg:p-20 text-center border-dashed border-2 flex flex-col items-center justify-center space-y-6 sm:space-y-8 ${className}`} hover={false}>
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-[var(--bg-card-muted)] flex items-center justify-center text-[var(--accent)] opacity-70">
          <Icon size={64} strokeWidth={1.5} />
        </div>
        <div className="max-w-lg space-y-3 sm:space-y-4">
          <h4 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-[var(--text-primary)] leading-snug">{title}</h4>
          <p className="text-sm sm:text-base lg:text-lg font-medium text-[var(--text-secondary)] leading-relaxed px-4">{description}</p>
        </div>
        {action && <div className="pt-6 sm:pt-8 w-full sm:w-auto">{action}</div>}
      </Card>
    ),
  };

  return variants[variant];
};

// Re-export Skeleton and Loading components
export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonList } from './Skeleton';
export { LoadingProgress, LoadingSpinner, LoadingOverlay } from './LoadingProgress';
