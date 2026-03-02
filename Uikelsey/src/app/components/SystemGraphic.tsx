export function SystemGraphic() {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-auto">
      {/* Abstract flow diagram representing EB-1 process */}
      
      {/* Connection lines */}
      <line x1="60" y1="60" x2="140" y2="60" stroke="#94a3b8" strokeWidth="2" />
      <line x1="180" y1="60" x2="260" y2="60" stroke="#94a3b8" strokeWidth="2" />
      <line x1="300" y1="60" x2="340" y2="60" stroke="#94a3b8" strokeWidth="2" />
      
      <line x1="60" y1="150" x2="140" y2="150" stroke="#94a3b8" strokeWidth="2" />
      <line x1="180" y1="150" x2="260" y2="150" stroke="#94a3b8" strokeWidth="2" />
      <line x1="300" y1="150" x2="340" y2="150" stroke="#94a3b8" strokeWidth="2" />
      
      <line x1="60" y1="240" x2="140" y2="240" stroke="#94a3b8" strokeWidth="2" />
      <line x1="180" y1="240" x2="260" y2="240" stroke="#94a3b8" strokeWidth="2" />
      
      {/* Vertical connections */}
      <line x1="160" y1="75" x2="160" y2="135" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,4" />
      <line x1="160" y1="165" x2="160" y2="225" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,4" />
      
      {/* Blocks - different sizes to show hierarchy */}
      <rect x="20" y="45" width="40" height="30" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" rx="4" />
      <rect x="140" y="45" width="40" height="30" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" rx="4" />
      <rect x="260" y="45" width="40" height="30" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" rx="4" />
      <rect x="340" y="45" width="40" height="30" fill="#e0f2fe" stroke="#3b82f6" strokeWidth="2" rx="4" />
      
      <rect x="20" y="135" width="40" height="30" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" rx="4" />
      <rect x="140" y="135" width="40" height="30" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" rx="4" />
      <rect x="260" y="135" width="40" height="30" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" rx="4" />
      <rect x="340" y="135" width="40" height="30" fill="#e0f2fe" stroke="#3b82f6" strokeWidth="2" rx="4" />
      
      <rect x="20" y="225" width="40" height="30" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" rx="4" />
      <rect x="140" y="225" width="40" height="30" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" rx="4" />
      <rect x="260" y="225" width="40" height="30" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" rx="4" />
    </svg>
  );
}
