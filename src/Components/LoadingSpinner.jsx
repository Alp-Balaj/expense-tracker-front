import React from 'react';
import { ClipLoader } from 'react-spinners';

function LoadingSpinner() {
  return (
    <div style={styles.container}>
      <ClipLoader
        color={'orange'}
        size={150}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
    </div>
  );
}

const styles = {
  container: {
    height: '85vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }
};

export default LoadingSpinner;
