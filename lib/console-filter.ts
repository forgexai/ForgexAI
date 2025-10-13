
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  
  console.error = (...args: any[]) => {
    const message = args[0];
    
    if (
      typeof message === 'string' && 
      message.includes('Each child in a list should have a unique "key" prop') &&
      args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('@privy-io') || arg.includes('SignRequestScreen'))
      )
    ) {
      return;
    }
  
    originalError.apply(console, args);
  };
}
