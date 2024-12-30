const validateACLSyntax = (parsedAcl) => {
  const errors = [];
  
  // Validate users and groups syntax
  if (parsedAcl.acls) {
    parsedAcl.acls.forEach((rule, index) => {
      // Validate source format (user/group)
      if (!rule.src.every(src => 
        src.match(/^([a-zA-Z0-9_.-]+@[a-zA-Z0-9_.-]+|group:[a-zA-Z0-9_-]+)$/)
      )) {
        errors.push(`Invalid source format in rule ${index}`);
      }
      
      // Validate action
      if (!['accept', 'deny'].includes(rule.action)) {
        errors.push(`Invalid action in rule ${index}: must be 'accept' or 'deny'`);
      }
      
      // Validate destination format
      if (rule.dst) {
        rule.dst.forEach(dst => {
          if (!dst.match(/^[0-9.:/*]+$/)) {
            errors.push(`Invalid destination format in rule ${index}`);
          }
        });
      }
    });
  }
  
  return errors;
};

export { validateACLSyntax }; 