
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {

  const originalConsoleError = console.error;
  
  console.error = (...args: any[]) => {
    const message = args[0];
    
    if (typeof message === 'string' && 
        message.includes('Each child in a list should have a unique "key" prop')) {

      const stack = new Error().stack || '';
      if (stack.includes('@privy-io') || 
          stack.includes('SignRequestScreen') || 
          stack.includes('Vm') ||
          stack.includes('privy') ||
          stack.includes('ClientProvider')) {
        return;
      }
    }
    
    originalConsoleError.apply(console, args);
  };
}
