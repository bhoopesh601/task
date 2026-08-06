/**
 * PriorityIcon - Speech bubble priority indicator icon component.
 * 
 * Low Priority: A single exclamation mark inside a green speech bubble (!)
 * Medium Priority: Two exclamation marks inside an orange speech bubble (!!)
 * High Priority: Three exclamation marks inside a red speech bubble (!!!)
 * 
 * @param {string} priority - 'Low', 'Medium', 'High' (or lowercase)
 * @param {number} size - Icon size in pixels (default 18)
 * @param {string} className - Optional additional CSS classes
 * @param {object} style - Optional inline styles
 */
const PriorityIcon = ({ priority, size = 18, className = '', style = {} }) => {
  const normPriority = (priority || 'medium').toString().toLowerCase();

  let color = '#f59e0b';
  if (normPriority === 'high') {
    color = '#ef4444';
  } else if (normPriority === 'low') {
    color = '#22c55e';
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`priority-icon priority-icon--${normPriority} ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-label={`${priority} priority icon`}
      role="img"
    >
      {/* Speech bubble outline */}
      <path
        d="M 12 2.5 C 6.75 2.5 2.5 6.5 2.5 11.5 C 2.5 13.8 3.35 15.9 4.75 17.5 L 3.5 21 C 3.3 21.5 3.8 22 4.3 21.8 L 7.9 20.3 C 9.15 20.8 10.55 21 12 21 C 17.25 21 21.5 17 21.5 11.5 C 21.5 6.5 17.25 2.5 12 2.5 Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Exclamation marks inside bubble based on priority level */}
      {normPriority === 'low' && (
        <g>
          <line x1="12" y1="6.8" x2="12" y2="12.2" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="12" cy="15.2" r="1.2" fill={color} />
        </g>
      )}

      {normPriority === 'medium' && (
        <g>
          <line x1="9.5" y1="6.8" x2="9.5" y2="12.2" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <circle cx="9.5" cy="15.2" r="1.1" fill={color} />
          <line x1="14.5" y1="6.8" x2="14.5" y2="12.2" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <circle cx="14.5" cy="15.2" r="1.1" fill={color} />
        </g>
      )}

      {normPriority === 'high' && (
        <g>
          <line x1="7.5" y1="6.8" x2="7.5" y2="12.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="7.5" cy="15.2" r="1" fill={color} />
          <line x1="12" y1="6.8" x2="12" y2="12.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="15.2" r="1" fill={color} />
          <line x1="16.5" y1="6.8" x2="16.5" y2="12.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="16.5" cy="15.2" r="1" fill={color} />
        </g>
      )}
    </svg>
  );
};

export default PriorityIcon;
