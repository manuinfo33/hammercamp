import React, { useState, useEffect } from 'react';

export default function Typewriter({ text, speed = 80, className, style }) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let i = 0;
    setDisplayText('');
    const timer = setInterval(() => {
      // Use function to ensure we get the correct index
      setDisplayText((prev) => text.substring(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return <span className={className} style={style}>{displayText}</span>;
}
