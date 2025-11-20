import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, LineChart, PieChart, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line, Pie, Cell, ResponsiveContainer, Area } from 'recharts';
import { MessageSquare, Calendar, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Users, Activity, Download, Filter } from 'lucide-react';

const DashboardHome = () => {
  const [data, setData] = useState({
    stats: {},
    kpis: {},
    comparativaMensual: [],
    enviosPorHora: [],
    estadoMensajes: [],
    respuestasPacientes: [],
    smsPorDia: [],
    porcentajeNoContactados: {},
    rankingConfirmaciones: [],
    analisisCanales: [],
    topPacientes: [],
    resumenDiario: {},
    tendenciasSemana: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = () => {
    setLoading(true);
    axios.get('http://localhost:3001/api/dashboard/stats')
      .then(response => {
        setData(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error al obtener datos:", error);
        setLoading(false);
      });
  };

  const exportToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Métrica,Valor\n"
      + `Tasa de Éxito,${data.kpis?.tasa_exito || 0}%\n`
      + `Tasa de No Contacto,${data.kpis?.tasa_no_contacto || 0}%\n`
      + `Promedio Diario,${data.kpis?.promedio_diario || 0}\n`
      + `Total Mes Actual,${data.stats?.total_mes_actual || 0}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_dashboard_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = {
    primary: '#F97316',
    secondary: '#FB923C',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Cargando dashboard...</div>
      </div>
    );
  }

  const tendenciaVsMesAnterior = data.stats?.total_mes_actual > data.stats?.total_mes_anterior;
  const porcentajeCambio = data.stats?.total_mes_anterior
    ? (((data.stats?.total_mes_actual - data.stats?.total_mes_anterior) / data.stats?.total_mes_anterior) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header con título y controles */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              Dashboard Ejecutivo
            </h2>
            <p className="text-gray-400 mt-2 text-sm">Análisis completo de recordatorios y gestión de citas</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400 bg-slate-800/50 px-4 py-2 rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Actualizado: {new Date().toLocaleTimeString()}</span>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* KPIs Principales - Tarjetas grandes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "Recordatorios Hoy",
              value: data.stats?.sms_enviados || 0,
              icon: MessageSquare,
              color: COLORS.primary,
              subtitle: "Programados para envío"
            },
            {
              title: "Citas Programadas",
              value: data.stats?.citas_programadas || 0,
              icon: Calendar,
              color: COLORS.info,
              subtitle: "Total de citas activas"
            },
            {
              title: "Confirmaciones",
              value: data.stats?.confirmaciones || 0,
              icon: CheckCircle,
              color: COLORS.success,
              subtitle: `${data.kpis?.tasa_exito || 0}% tasa de éxito`
            },
            {
              title: "Pendientes",
              value: data.stats?.cancelaciones || 0,
              icon: XCircle,
              color: COLORS.danger,
              subtitle: `${data.kpis?.tasa_no_contacto || 0}% sin contactar`
            }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-slate-800/50 rounded-xl shadow-xl border border-slate-700/30 p-6 hover:border-orange-500/50 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                    <h3 className="text-3xl font-bold mt-2 text-white">{stat.value}</h3>
                    <p className="text-gray-500 text-xs mt-1">{stat.subtitle}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${stat.color}20` }}>
                    <Icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* KPIs Ejecutivos - Métricas clave */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl border border-orange-500/30 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-orange-400" />
              <p className="text-gray-300 text-sm font-medium">Tasa de Éxito</p>
            </div>
            <p className="text-3xl font-bold text-white">{data.kpis?.tasa_exito || 0}%</p>
            <p className="text-gray-400 text-xs mt-1">Mensajes entregados exitosamente</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl border border-blue-500/30 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <p className="text-gray-300 text-sm font-medium">Promedio Diario</p>
            </div>
            <p className="text-3xl font-bold text-white">{data.kpis?.promedio_diario || 0}</p>
            <p className="text-gray-400 text-xs mt-1">Envíos por día este mes</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl border border-green-500/30 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-green-400" />
              <p className="text-gray-300 text-sm font-medium">Días Activos</p>
            </div>
            <p className="text-3xl font-bold text-white">{data.kpis?.dias_activos || 0}</p>
            <p className="text-gray-400 text-xs mt-1">Días con actividad este mes</p>
          </div>

          <div className={`bg-gradient-to-br ${tendenciaVsMesAnterior ? 'from-green-500/10 to-green-600/5 border-green-500/30' : 'from-red-500/10 to-red-600/5 border-red-500/30'} rounded-xl border p-6`}>
            <div className="flex items-center gap-3 mb-2">
              {tendenciaVsMesAnterior ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
              <p className="text-gray-300 text-sm font-medium">Tendencia Mensual</p>
            </div>
            <p className={`text-3xl font-bold ${tendenciaVsMesAnterior ? 'text-green-400' : 'text-red-400'}`}>
              {tendenciaVsMesAnterior ? '+' : ''}{porcentajeCambio}%
            </p>
            <p className="text-gray-400 text-xs mt-1">vs mes anterior</p>
          </div>
        </div>

        {/* Gráficos principales - Fila 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* SMS por día - Últimos 30 días */}
          <div className="lg:col-span-2 bg-slate-800/50 rounded-xl shadow-xl border border-slate-700/30 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-orange-400">Actividad Últimos 30 Días</h3>
              <Filter className="w-5 h-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.smsPorDia.map(item => ({
                ...item,
                fecha: new Date(item.fecha).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
              }))}>
                <defs>
                  <linearGradient id="colorEnviados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExitosos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="fecha" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Area type="monotone" dataKey="enviados" stroke={COLORS.primary} fillOpacity={1} fill="url(#colorEnviados)" name="Total Enviados" />
                <Area type="monotone" dataKey="exitosos" stroke={COLORS.success} fillOpacity={1} fill="url(#colorExitosos)" name="Exitosos" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Estado de mensajes */}
          <div className="bg-slate-800/50 rounded-xl shadow-xl border border-slate-700/30 p-6">
            <h3 className="text-xl font-semibold text-orange-400 mb-4">Estado de Mensajes</h3>
            {data.estadoMensajes?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.estadoMensajes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="valor"
                    nameKey="nombre"
                    label={({ nombre, porcentaje }) => `${nombre}: ${porcentaje}%`}
                  >
                    {data.estadoMensajes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.success : COLORS.warning} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center h-[300px] flex items-center justify-center">No hay datos disponibles</p>
            )}
          </div>
        </div>

        {/* Gráficos adicionales - Fila 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Comparativa mensual */}
          <div className="bg-slate-800/50 rounded-xl shadow-xl border border-slate-700/30 p-6">
            <h3 className="text-xl font-semibold text-orange-400 mb-4">Comparativa Últimos 6 Meses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.comparativaMensual}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="mes" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Bar dataKey="exitosos" fill={COLORS.success} name="Exitosos" />
                <Bar dataKey="pendientes" fill={COLORS.warning} name="Pendientes" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribución por hora */}
          <div className="bg-slate-800/50 rounded-xl shadow-xl border border-slate-700/30 p-6">
            <h3 className="text-xl font-semibold text-orange-400 mb-4">Distribución por Hora del Día</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.enviosPorHora}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hora" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Line type="monotone" dataKey="enviados" stroke={COLORS.primary} strokeWidth={2} name="Total" />
                <Line type="monotone" dataKey="exitosos" stroke={COLORS.success} strokeWidth={2} name="Exitosos" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking y Top Pacientes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Ranking de días */}
          <div className="bg-slate-800/50 rounded-xl shadow-xl border border-slate-700/30 p-6">
            <h3 className="text-xl font-semibold text-orange-400 mb-4">Días con Más Confirmaciones</h3>
            <div className="space-y-3">
              {data.rankingConfirmaciones.map((dia, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        index === 1 ? 'bg-gray-400/20 text-gray-400' :
                        index === 2 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-slate-600/20 text-slate-400'}`}>
                      {index + 1}
                    </div>
                    <span className="text-white font-medium">{dia.dia}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{dia.confirmaciones}</p>
                    <p className="text-gray-400 text-xs">{dia.porcentaje}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Pacientes */}
          <div className="bg-slate-800/50 rounded-xl shadow-xl border border-slate-700/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-orange-400" />
              <h3 className="text-xl font-semibold text-orange-400">Top Pacientes (Últimos 3 Meses)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-2 text-gray-400 text-sm font-medium">Paciente</th>
                    <th className="text-center py-2 px-2 text-gray-400 text-sm font-medium">Total</th>
                    <th className="text-center py-2 px-2 text-gray-400 text-sm font-medium">Confirmadas</th>
                    <th className="text-center py-2 px-2 text-gray-400 text-sm font-medium">Pendientes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPacientes.slice(0, 8).map((paciente, index) => (
                    <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="py-2 px-2 text-white text-sm">{paciente.nombre_paciente}</td>
                      <td className="py-2 px-2 text-center text-white font-semibold">{paciente.total_citas}</td>
                      <td className="py-2 px-2 text-center text-green-400">{paciente.confirmadas}</td>
                      <td className="py-2 px-2 text-center text-orange-400">{paciente.pendientes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Resumen Ejecutivo del Día */}
        <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 rounded-xl border border-orange-500/30 p-6 mb-8">
          <h3 className="text-2xl font-semibold text-orange-400 mb-4">Resumen Ejecutivo del Día</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Total del Día</p>
              <p className="text-3xl font-bold text-white">{data.resumenDiario?.total || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Exitosos</p>
              <p className="text-3xl font-bold text-green-400">{data.resumenDiario?.exitosos || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Pendientes</p>
              <p className="text-3xl font-bold text-orange-400">{data.resumenDiario?.pendientes || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Tasa de Éxito</p>
              <p className="text-3xl font-bold text-blue-400">{data.resumenDiario?.tasa_exito || 0}%</p>
            </div>
          </div>
        </div>

        {/* Tendencias semanales */}
        <div className="bg-slate-800/50 rounded-xl shadow-xl border border-slate-700/30 p-6">
          <h3 className="text-xl font-semibold text-orange-400 mb-4">Tendencias Semanales (12 Semanas)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.tendenciasSemana}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="semana" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Line type="monotone" dataKey="total" stroke={COLORS.primary} strokeWidth={2} name="Total Envíos" />
              <Line type="monotone" dataKey="tasa_exito" stroke={COLORS.success} strokeWidth={2} name="Tasa de Éxito (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
