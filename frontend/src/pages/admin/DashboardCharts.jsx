import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

export const RevenueChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Belum ada data pendapatan</div>;
  }

  const chartData = data.map(d => ({
    name: d.month,
    revenue: Number(d.total)
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey="name" fontSize={12} stroke="var(--color-text-muted)" tickMargin={10} />
          <YAxis 
            fontSize={12} 
            stroke="var(--color-text-muted)" 
            tickFormatter={(val) => `Rp ${val / 1000000}jt`} 
            width={70}
          />
          <Tooltip 
            formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`}
            contentStyle={{ borderRadius: '12px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
          <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={4} dot={{ r: 6, fill: 'var(--color-primary)', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PopularRoomsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Belum ada data ruangan</div>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
          <XAxis type="number" fontSize={12} stroke="var(--color-text-muted)" />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={120} 
            fontSize={11} 
            stroke="var(--color-text-main)" 
            tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
            contentStyle={{ borderRadius: '12px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          />
          <Bar dataKey="bookings" name="Total Pesanan" fill="var(--color-success)" radius={[0, 6, 6, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const StatusChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Belum ada data status</div>;
  }

  const COLORS = ['#f59e0b', '#10b981', '#ef4444', '#6366f1'];
  
  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={8}
            dataKey="count"
            nameKey="status"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
