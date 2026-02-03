export const setAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getAuth = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return {
    token,
    user: user ? JSON.parse(user) : null,
    updateUser: (updates) => {
      const currentUser = localStorage.getItem('user');
      if (currentUser) {
        const updatedUser = { ...JSON.parse(currentUser), ...updates };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // Dispatch event to notify components of user update
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
      }
    }
  };
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};
