import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({
  value = 0,
  max = 100,
  variant = 'minecraft', // minecraft, habbo
  size = 'md', // sm, md, lg
  showLabel = false,
  labelPosition = 'right', // right, top, inside
  animated = true,
  className = '',
  ...props
}) => {
  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  // Size classes
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6'
  };
  
  // Variant classes
  const variantClasses = {
    minecraft: {
      container: 'bg-gray-800 border-2 border-gray-900 rounded-sm overflow-hidden',
      bar: 'bg-minecraft-green'
    },
    habbo: {
      container: 'bg-gray-800 border border-gray-700 rounded-habbo overflow-hidden',
      bar: 'bg-minecraft-habbo-blue'
    }
  };
  
  // Label position classes
  const labelPositionClasses = {
    right: 'ml-2',
    top: 'mb-1',
    inside: 'absolute inset-0 flex items-center justify-center text-white text-xs font-bold'
  };
  
  // Base classes
  const containerClasses = `
    relative
    ${sizeClasses[size]}
    ${variantClasses[variant].container}
    ${className}
  `;
  
  // Label component
  const Label = () => (
    <div className={labelPositionClasses[labelPosition]}>
      {labelPosition === 'inside' ? `${Math.round(percentage)}%` : `${value}/${max}`}
    </div>
  );
  
  return (
    <div className={labelPosition === 'top' ? 'space-y-1' : 'flex items-center'}>
      {showLabel && labelPosition === 'top' && <Label />}
      
      <div className={containerClasses} {...props}>
        <motion.div
          className={`h-full ${variantClasses[variant].bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: animated ? 0.8 : 0, 
            ease: 'easeOut'
          }}
        />
        {showLabel && labelPosition === 'inside' && <Label />}
      </div>
      
      {showLabel && labelPosition === 'right' && <Label />}
    </div>
  );
};

// Specialized variants
ProgressBar.Minecraft = (props) => <ProgressBar variant="minecraft" {...props} />;
ProgressBar.Habbo = (props) => <ProgressBar variant="habbo" {...props} />;

// Experience bar with level indicator
ProgressBar.ExperienceBar = ({ 
  experience = 0, 
  level = 1, 
  nextLevelExp = 100,
  ...props 
}) => {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-300">Level {level}</span>
        <span className="text-sm text-gray-300">{experience}/{nextLevelExp} XP</span>
      </div>
      <ProgressBar 
        value={experience} 
        max={nextLevelExp}
        variant="minecraft"
        size="md"
        {...props}
      />
    </div>
  );
};

// Health bar
ProgressBar.HealthBar = ({ 
  health = 100, 
  maxHealth = 100,
  ...props 
}) => {
  // Health color based on percentage
  const getHealthColor = () => {
    const percentage = (health / maxHealth) * 100;
    if (percentage > 70) return 'bg-green-600';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-600';
  };
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-300">Health</span>
        <span className="text-sm text-gray-300">{health}/{maxHealth}</span>
      </div>
      <div className="h-4 bg-gray-800 border-2 border-gray-900 rounded-sm overflow-hidden">
        <motion.div
          className={`h-full ${getHealthColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${(health / maxHealth) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default ProgressBar; 