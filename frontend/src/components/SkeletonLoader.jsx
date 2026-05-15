const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const skeletons = Array(count).fill(0);

  const cardSkeleton = (key) => (
    <div key={key} className="card" style={{ padding: '0', overflow: 'hidden', height: '350px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '200px', backgroundColor: '#e2e8f0', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
      <div style={{ padding: '1.5rem', flex: 1 }}>
        <div style={{ height: '20px', width: '70%', backgroundColor: '#e2e8f0', marginBottom: '1rem', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
        <div style={{ height: '15px', width: '40%', backgroundColor: '#e2e8f0', marginBottom: '1.5rem', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
        <div style={{ height: '40px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
      </div>
    </div>
  );

  const rowSkeleton = (key) => (
    <div key={key} style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
      <div style={{ width: '80px', height: '60px', backgroundColor: '#e2e8f0', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
      <div style={{ flex: 1 }}>
        <div style={{ height: '15px', width: '30%', backgroundColor: '#e2e8f0', marginBottom: '0.5rem', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
        <div style={{ height: '12px', width: '15%', backgroundColor: '#e2e8f0', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
      </div>
      <div style={{ width: '100px', height: '30px', backgroundColor: '#e2e8f0', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
    </div>
  );

  return (
    <div style={{ 
      display: type === 'card' ? 'grid' : 'block', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
      gap: '2rem' 
    }}>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
      {skeletons.map((_, i) => type === 'card' ? cardSkeleton(i) : rowSkeleton(i))}
    </div>
  );
};

export default SkeletonLoader;
