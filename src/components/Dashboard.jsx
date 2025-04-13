"use client"

import axios from "axios"
import { useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BASE_URL } from "../config/api"

const Dashboard = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [filteredLogs, setFilteredLogs] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [timeRange, setTimeRange] = useState("24h")
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 10

  const COLORS = {
    primary: "#6366F1", // Indigo
    secondary: "#10B981", // Emerald
    accent: "#F59E0B", // Amber
    danger: "#EF4444", // Red
    success: "#10B981", // Emerald
    warning: "#F59E0B", // Amber
    info: "#3B82F6", // Blue
    background: "#F9FAFB", // Gray-50
    card: "#FFFFFF", // White
    text: {
      primary: "#111827", // Gray-900
      secondary: "#4B5563", // Gray-600
      muted: "#9CA3AF", // Gray-400
    },
    logLevels: {
      error: "#EF4444", // Red
      warn: "#F59E0B", // Amber
      info: "#3B82F6", // Blue
      debug: "#8B5CF6", // Purple
      trace: "#10B981", // Emerald
      default: "#6B7280", // Gray
    },
    pieChart: ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#6B7280"],
  }

  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch logs
      const logsResponse = await axios.get(`${BASE_URL}/api/logs`)
      console.log("Logs data sample:", logsResponse.data.slice(0, 2))

      // Check if we have memory usage data
      const hasMemoryData = logsResponse.data.some((log) => log.system && log.system.memoryUsage)
      console.log("Has memory usage data:", hasMemoryData)

      // Check log levels
      const logLevels = new Set(logsResponse.data.map((log) => log.logLevel).filter(Boolean))
      console.log("Available log levels:", Array.from(logLevels))

      setLogs(logsResponse.data)
      setFilteredLogs(logsResponse.data)
      console.log('Logs data sample:', logsResponse.data.slice(0, 2))
      

      // Fetch info
      const infoResponse = await axios.get(`${BASE_URL}/api/getInfo`)
      setInfo(infoResponse.data)

      setError(null)
      setLastUpdate(new Date())
    } catch (err) {
      setError("Failed to fetch data: " + err.message)
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter logs based on search term and time range
  useEffect(() => {
    let filtered = logs

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (log) =>
          (log.path && log.path.toLowerCase().includes(term)) ||
          (log.method && log.method.toLowerCase().includes(term)) ||
          (log.logLevel && log.logLevel.toLowerCase().includes(term)) ||
          (log.status && log.status.toString().includes(term)),
      )
    }

    // Apply time range filter
    if (timeRange !== "all") {
      const now = new Date()
      let timeLimit

      switch (timeRange) {
        case "1h":
          timeLimit = new Date(now.getTime() - 60 * 60 * 1000)
          break
        case "6h":
          timeLimit = new Date(now.getTime() - 6 * 60 * 60 * 1000)
          break
        case "24h":
          timeLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case "7d":
          timeLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        default:
          timeLimit = new Date(0) // All time
      }

      filtered = filtered.filter((log) => {
        if (!log.timestamp) return true

        let logDate
        if (typeof log.timestamp === "string") {
          logDate = new Date(log.timestamp)
        } else if (log.timestamp instanceof Date) {
          logDate = log.timestamp
        } else if (log.timestamp.seconds) {
          logDate = new Date(log.timestamp.seconds * 1000)
        } else {
          return true // Include logs with invalid timestamps
        }

        return !isNaN(logDate.getTime()) && logDate >= timeLimit
      })
    }

    setFilteredLogs(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [logs, searchTerm, timeRange])

  const getHourlyData = () => {
    // Initialize hourly data with proper structure
    const hourlyData = Array(24)
      .fill()
      .map((_, i) => ({
        hour: `${i}:00`,
        server1: 0,
        server2: 0,
      }))

    filteredLogs.forEach((log) => {
      if (log && log.timestamp) {
        // Handle different timestamp formats
        let date
        if (typeof log.timestamp === "string") {
          // Try to parse the timestamp string
          date = new Date(log.timestamp)

          // If parsing fails, try to extract the date from the string format
          if (isNaN(date.getTime())) {
            // Extract date from format like "2 de abril de 2025, 11:01:28 p.m. UTC-6"
            const match = log.timestamp.match(/(\d+) de .+ de (\d+), (\d+):(\d+):(\d+)/)
            if (match) {
              const [_, day, year, hour, minute, second] = match
              // Create a date object with the extracted values
              date = new Date(year, 3, day, hour, minute, second) // 3 is April (0-indexed months)
            }
          }
        } else if (log.timestamp instanceof Date) {
          date = log.timestamp
        } else if (log.timestamp.seconds) {
          // Handle Firestore timestamp
          date = new Date(log.timestamp.seconds * 1000)
        }

        if (date && !isNaN(date.getTime())) {
          // Check if date is valid
          const hour = date.getHours()
          const serverId = Number.parseInt(log.serverId) || 1

          if (hour >= 0 && hour < 24) {
            // Validate hour range
            if (serverId === 1) {
              hourlyData[hour].server1 += 1
            } else if (serverId === 2) {
              hourlyData[hour].server2 += 1
            }
          }
        }
      }
    })

    return hourlyData
  }

  const getStatusData = () => {
    // Definimos grupos con etiquetas más descriptivas
    const statusGroups = [
      { range: "200-299", label: "Success 200-299", baseStatus: 200 },
      { range: "300-399", label: "Redirect 300-399", baseStatus: 300 },
      { range: "400-499", label: "Client error 400-499", baseStatus: 400 },
      { range: "500-599", label: "Server error 500-599", baseStatus: 500 },
    ];
  
    return statusGroups.map((group) => {
      const count1 = filteredLogs.filter(
        (log) =>
          (log.serverId === 1 || !log.serverId) &&
          log.status &&
          log.status >= group.baseStatus &&
          log.status < group.baseStatus + 100
      ).length;
  
      const count2 = filteredLogs.filter(
        (log) =>
          log.serverId === 2 &&
          log.status &&
          log.status >= group.baseStatus &&
          log.status < group.baseStatus + 100
      ).length;
  
      return {
        name: group.label,  // Usamos la etiqueta descriptiva
        server1: count1,
        server2: count2,
        // Opcional: conservar el rango original como metadata
        meta: group.range
      };
    });
  };

  const formatLogTimestamp = (timestamp) => {
    if (!timestamp) return "N/A"

    let date

    // Caso 1: Objeto Firestore timestamp {_seconds, _nanoseconds}
    if (timestamp._seconds !== undefined) {
      date = new Date(timestamp._seconds * 1000 + Math.floor(timestamp._nanoseconds / 1000000))
      return date.toLocaleTimeString()
    }

    // Caso 2: Ya es un objeto Date válido
    if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
      return timestamp.toLocaleTimeString()
    }

    // Caso 3: Es un string que puede ser parseado directamente
    if (typeof timestamp === "string") {
      date = new Date(timestamp)
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString()
      }

      // Intento 2: Formato español con mes
      const spanishMonths = {
        enero: 0,
        febrero: 1,
        marzo: 2,
        abril: 3,
        mayo: 4,
        junio: 5,
        julio: 6,
        agosto: 7,
        septiembre: 8,
        octubre: 9,
        noviembre: 10,
        diciembre: 11,
      }

      const match = timestamp.match(/(\d{1,2}) de (\w+) de (\d{4}), (\d{1,2}):(\d{2}):(\d{2}) ([ap])\.m\. UTC([+-]\d+)/)
      if (match) {
        const [, day, month, year, hour, minute, second, period, tzOffset] = match
        const monthNum = spanishMonths[month.toLowerCase()]
        let hourNum = Number.parseInt(hour)

        // Ajuste para formato 12h
        if (period === "p" && hourNum < 12) hourNum += 12
        if (period === "a" && hourNum === 12) hourNum = 0

        date = new Date(Date.UTC(year, monthNum, day, hourNum, minute, second))
        // Ajustar por zona horaria
        date.setMinutes(date.getMinutes() + Number.parseInt(tzOffset) * 60)
        return date.toLocaleTimeString()
      }

      // Intento 3: Formato ISO sin zona horaria
      const isoMatch = timestamp.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/)
      if (isoMatch) {
        date = new Date(isoMatch[0] + "Z")
        return date.toLocaleTimeString()
      }
    }
    // Caso 4: Timestamp numérico
    else if (typeof timestamp === "number") {
      date = new Date(timestamp)
      return date.toLocaleTimeString()
    }

    // Último intento: extraer hora manualmente si el formato es conocido pero no parseable
    const timeMatch = timestamp?.toString().match(/(\d{1,2}:\d{2}:\d{2})/)
    if (timeMatch) {
      return timeMatch[0]
    }

    console.warn("Formato de fecha no reconocido:", timestamp)
    return "N/A"
  }

  const getMethodData = () => {
    const methods = {}
    filteredLogs.forEach((log) => {
      if (!log.method) return

      if (!methods[log.method]) {
        methods[log.method] = { name: log.method, server1: 0, server2: 0 }
      }

      if (log.serverId === 2) {
        methods[log.method].server2 += 1
      } else {
        methods[log.method].server1 += 1
      }
    })
    return Object.values(methods)
  }

  const getLogLevelData = () => {
    // Define standard log levels and initialize counts
    const logLevels = {
      error: {
        name: "Error",
        server1: 0,
        server2: 0,
        color: COLORS.logLevels.error,
      },
      warn: {
        name: "Warning",
        server1: 0,
        server2: 0,
        color: COLORS.logLevels.warn,
      },
      info: {
        name: "Info",
        server1: 0,
        server2: 0,
        color: COLORS.logLevels.info,
      },
      debug: {
        name: "Debug",
        server1: 0,
        server2: 0,
        color: COLORS.logLevels.debug,
      },
      trace: {
        name: "Trace",
        server1: 0,
        server2: 0,
        color: COLORS.logLevels.trace,
      },
      other: {
        name: "Other",
        server1: 0,
        server2: 0,
        color: COLORS.logLevels.default,
      },
    }

    // Count logs by level
    filteredLogs.forEach((log) => {
      if (!log) return

      const level = (log.logLevel || "").toLowerCase()
      const serverId = log.serverId === 2 ? "server2" : "server1"

      if (logLevels[level]) {
        logLevels[level][serverId] += 1
      } else {
        logLevels.other[serverId] += 1
      }
    })

    // Convert to array and filter out empty levels
    return Object.values(logLevels).filter((level) => level.server1 > 0 || level.server2 > 0)
  }

  const getLogLevelPieData = (serverId) => {
    const logLevels = {}

    filteredLogs.forEach((log) => {
      if (!log || (serverId === 1 && log.serverId === 2) || (serverId === 2 && log.serverId !== 2)) return

      const level = (log.logLevel || "unknown").toLowerCase()

      if (!logLevels[level]) {
        logLevels[level] = {
          name: level.charAt(0).toUpperCase() + level.slice(1),
          value: 0,
        }
      }

      logLevels[level].value += 1
    })

    return Object.values(logLevels)
  }

  const getResponseTimeData = () => {
    const timeRanges = [
      { range: "0-100ms", min: 0, max: 100 },
      { range: "100-300ms", min: 100, max: 300 },
      { range: "300-500ms", min: 300, max: 500 },
      { range: "500ms+", min: 500, max: Number.POSITIVE_INFINITY },
    ]

    const data = timeRanges.map(({ range, min, max }) => ({
      name: range,
      server1: filteredLogs.filter(
        (log) => (log.serverId === 1 || !log.serverId) && log.responseTime >= min && log.responseTime < max,
      ).length,
      server2: filteredLogs.filter((log) => log.serverId === 2 && log.responseTime >= min && log.responseTime < max)
        .length,
    }))

    return data
  }

  const getAverageResponseTimes = () => {
    const server1Logs = filteredLogs.filter((log) => log.serverId === 1 || !log.serverId)
    const server2Logs = filteredLogs.filter((log) => log.serverId === 2)

    // Add null checks to prevent division by zero
    const avg1 = server1Logs.length
      ? server1Logs.reduce((acc, log) => acc + (log.responseTime || 0), 0) / server1Logs.length
      : 0
    const avg2 = server2Logs.length
      ? server2Logs.reduce((acc, log) => acc + (log.responseTime || 0), 0) / server2Logs.length
      : 0

    return {
      server1: Math.round(avg1),
      server2: Math.round(avg2),
    }
  }

  const getMemoryUsageData = () => {
    // Find the latest log for each server that has memory usage data
    const latestLogs = filteredLogs.reduce((acc, log) => {
      if (log && log.serverId && log.system && log.system.memoryUsage) {
        acc[log.serverId] = log.system.memoryUsage
      }
      return acc
    }, {})

    // Handle case when no memory usage data is available
    if (!latestLogs[1] && !latestLogs[2]) {
      return [{ name: "No Data", server1: 0, server2: 0 }]
    }

    return Object.entries(latestLogs[1] || {}).map(([key, value]) => ({
      name: key,
      server1: value ? value / 1024 / 1024 : 0, // Convert to MB
      server2: (latestLogs[2]?.[key] || 0) / 1024 / 1024,
    }))
  }

  const getPathUsageData = () => {
    const paths = {}
    filteredLogs.forEach((log) => {
      if (!log) return
      const path = log.path || "unknown"
      if (!paths[path]) {
        paths[path] = { name: path, server1: 0, server2: 0 }
      }
      if (log.serverId === 2) {
        paths[path].server2 += 1
      } else {
        paths[path].server1 += 1
      }
    })

    // Return top 5 paths by total usage
    return Object.values(paths)
      .sort((a, b) => b.server1 + b.server2 - (a.server1 + a.server2))
      .slice(0, 5)
  }

  const getErrorRateData = () => {
    const server1Logs = filteredLogs.filter((log) => log && (log.serverId === 1 || !log.serverId))
    const server2Logs = filteredLogs.filter((log) => log && log.serverId === 2)

    const getErrorRate = (serverLogs) => {
      const total = serverLogs.length
      const errors = serverLogs.filter((log) => log.status >= 400).length
      return total ? (errors / total) * 100 : 0
    }

    return [
      {
        name: "Error Rate",
        server1: getErrorRate(server1Logs),
        server2: getErrorRate(server2Logs),
      },
    ]
  }

  const getErrorsByStatusCode = () => {
    const errorCodes = {}

    filteredLogs.forEach((log) => {
      if (!log || !log.status || log.status < 400) return

      const statusCode = log.status.toString()
      if (!errorCodes[statusCode]) {
        errorCodes[statusCode] = { name: statusCode, server1: 0, server2: 0 }
      }

      if (log.serverId === 2) {
        errorCodes[statusCode].server2 += 1
      } else {
        errorCodes[statusCode].server1 += 1
      }
    })

    return Object.values(errorCodes).sort((a, b) => a.name.localeCompare(b.name))
  }

  const getTotalRequests = () => {
    const server1Count = filteredLogs.filter((log) => log.serverId === 1 || !log.serverId).length
    const server2Count = filteredLogs.filter((log) => log.serverId === 2).length
    return {
      server1: server1Count,
      server2: server2Count,
      total: server1Count + server2Count,
    }
  }

  const getSuccessRate = () => {
    const server1Logs = filteredLogs.filter((log) => log.serverId === 1 || !log.serverId)
    const server2Logs = filteredLogs.filter((log) => log.serverId === 2)

    const getRate = (serverLogs) => {
      const total = serverLogs.length
      const success = serverLogs.filter((log) => log.status < 400).length
      return total ? (success / total) * 100 : 0
    }

    return {
      server1: getRate(server1Logs),
      server2: getRate(server2Logs),
    }
  }

  // Add this function to check if chart data is empty
  const isDataEmpty = (data) => {
    if (!data || data.length === 0) return true;
    
    // Verifica si AL MENOS UN grupo tiene server1 o server2 > 0
    console.log("Logs usados para status data:", filteredLogs);
    return false;
    // return !data.some(
    //   (item) => (item.server1 > 0 || item.server2 > 0)
    // );

  };

  // Add this function to check if pie chart data is empty
  const isPieDataEmpty = (data) => {
    if (!data || data.length === 0) return true

    // Check if all values are zero
    return data.every((item) => item.value === 0)
  }

  // Generate test data for demonstration
  const generateTestData = () => {
    const testLogs = []
    const methods = ["GET", "POST", "PUT", "DELETE"]
    const paths = ["/api/users", "/api/products", "/api/orders", "/api/auth", "/api/logs"]
    const logLevels = ["info", "error", "warn", "debug", "trace"]
    const statusCodes = [200, 201, 301, 400, 401, 403, 404, 500]

    // Current time
    const now = new Date()

    // Generate 50 random logs
    for (let i = 0; i < 50; i++) {
      const serverId = Math.random() > 0.5 ? 2 : 1
      const method = methods[Math.floor(Math.random() * methods.length)]
      const path = paths[Math.floor(Math.random() * paths.length)]
      const logLevel = logLevels[Math.floor(Math.random() * logLevels.length)]
      const status = statusCodes[Math.floor(Math.random() * statusCodes.length)]
      const responseTime = Math.floor(Math.random() * 1000)

      // Create timestamp between now and 24 hours ago
      const timestamp = new Date(now.getTime() - Math.floor(Math.random() * 24 * 60 * 60 * 1000))

      // Create memory usage data
      const memoryUsage = {
        heapTotal: 50000000 + Math.floor(Math.random() * 10000000),
        heapUsed: 30000000 + Math.floor(Math.random() * 10000000),
        external: 2000000 + Math.floor(Math.random() * 1000000),
        rss: 80000000 + Math.floor(Math.random() * 20000000),
        arrayBuffers: 200000 + Math.floor(Math.random() * 100000),
      }

      testLogs.push({
        id: `test-${i}`,
        serverId,
        method,
        path,
        logLevel,
        status,
        responseTime,
        timestamp,
        system: {
          memoryUsage,
          environment: "development",
          nodeVersion: "v22.14.0",
          pid: 12345,
        },
      })
    }

    setLogs(prevLogs => [...prevLogs, ...testLogs])
  }

    // Generate test data for hourly traffic
    const generateHourlyTrafficData = () => {
      const testLogs = [];
      const methods = ["GET", "POST", "PUT", "DELETE"];
      const paths = ["/api/users", "/api/products", "/api/orders", "/api/auth", "/api/logs"];
      
      // Current time
      const now = new Date();
  
      // Generate 50 random logs with focus on hourly distribution
      for (let i = 0; i < 50; i++) {
        const serverId = Math.random() > 0.5 ? 2 : 1;
        const method = methods[Math.floor(Math.random() * methods.length)];
        const path = paths[Math.floor(Math.random() * paths.length)];
        const status = 200; // Success status for traffic data
        const responseTime = Math.floor(Math.random() * 1000);
  
        // Create timestamp between now and 24 hours ago
        const timestamp = new Date(now.getTime() - Math.floor(Math.random() * 24 * 60 * 60 * 1000));
  
        testLogs.push({
          id: `traffic-${i}`,
          serverId,
          method,
          path,
          status,
          responseTime,
          timestamp,
        });
      }
  
      setLogs(prevLogs => [...prevLogs, ...testLogs]);
    };
  
    // Generate test data for errors
    const generateErrorData = () => {
      const testLogs = [];
      const errorStatusCodes = [400, 401, 403, 404, 500, 502, 503];
      const paths = ["/api/users", "/api/products", "/api/orders", "/api/auth", "/api/logs"];
      
      // Current time
      const now = new Date();
  
      // Generate 20 error logs
      for (let i = 0; i < 20; i++) {
        const serverId = Math.random() > 0.5 ? 2 : 1;
        const status = errorStatusCodes[Math.floor(Math.random() * errorStatusCodes.length)];
        const path = paths[Math.floor(Math.random() * paths.length)];
        const method = "GET";
        const responseTime = Math.floor(Math.random() * 1000);
        const timestamp = new Date(now.getTime() - Math.floor(Math.random() * 24 * 60 * 60 * 1000));
  
        testLogs.push({
          id: `error-${i}`,
          serverId,
          method,
          path,
          status,
          responseTime,
          timestamp,
          logLevel: 'error'
        });
      }
  
      setLogs(prevLogs => [...prevLogs, ...testLogs]);
    };

  // Pagination for logs
  const indexOfLastLog = currentPage * logsPerPage
  const indexOfFirstLog = indexOfLastLog - logsPerPage
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog)
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
          <div className="text-xl font-medium text-gray-700">Loading dashboard data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-xl shadow-lg border border-red-100">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-50">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mb-4 text-xl font-semibold text-center text-gray-800">Error Loading Data</h2>
          <p className="text-gray-600 text-center">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full mt-6 px-4 py-2 text-white font-medium bg-indigo-500 rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const totalRequests = getTotalRequests()
  const successRate = getSuccessRate()
  const avgResponseTimes = getAverageResponseTimes()

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  M
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">Server Analytics Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchData}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                  disabled={loading}
                >
                  {loading ? "Actualizando..." : "Actualizar datos"}
                </button>
                {lastUpdate && (
                  <span className="text-sm text-gray-500">Última actualización: {lastUpdate.toLocaleTimeString()}</span>
                )}
              </div>
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                HM
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* System Info Card */}
        {info && (
          <div className="mb-8 overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">System Information</h2>
                  <p className="mt-1 text-gray-500">Server details and environment information</p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <span className="mr-1 h-2 w-2 rounded-full bg-green-400"></span>
                    Online
                  </span>
                  <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-sm font-medium text-gray-500 mb-1">Node Version</div>
                  <div className="text-lg font-semibold text-gray-900">{info.nodeVersion}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-sm font-medium text-gray-500 mb-1">Student</div>
                  <div className="text-lg font-semibold text-gray-900">{info.student.fullName}</div>
                  <div className="text-sm text-gray-500">{info.student.group}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-sm font-medium text-gray-500 mb-1">Total Requests</div>
                  <div className="text-lg font-semibold text-gray-900">{totalRequests.total.toLocaleString()}</div>
                  <div className="mt-1 flex items-center text-sm">
                    <span className="text-green-500 font-medium">{successRate.server1.toFixed(1)}% </span>
                    <span className="ml-1 text-gray-500">success rate</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-sm font-medium text-gray-500 mb-1">Avg Response Time</div>
                  <div className="text-lg font-semibold text-gray-900">{avgResponseTimes.server1}ms</div>
                  <div className="mt-1 flex items-center text-sm">
                    <span
                      className={`${avgResponseTimes.server1 < 200 ? "text-green-500" : "text-amber-500"} font-medium`}
                    >
                      {avgResponseTimes.server1 < 200 ? "Good" : "Average"}
                    </span>
                    <span className="ml-1 text-gray-500">performance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {["overview", "traffic", "performance", "logs", "errors"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Time Range Filter */}
        {activeTab !== "overview" && (
          <div className="mb-6 flex justify-end">
            <div className="inline-flex rounded-md shadow-sm">
              {["1h", "6h", "24h", "7d", "all"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`${
                    timeRange === range
                      ? "bg-indigo-50 text-indigo-700 border-indigo-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  } px-4 py-2 text-sm font-medium border first:rounded-l-md last:rounded-r-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                >
                  {range === "all" ? "All Time" : range}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Overview Tab Content */}
        {activeTab === "overview" && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all hover:shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-indigo-50">
                    <svg
                      className="w-6 h-6 text-indigo-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Server 1 Requests</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {totalRequests.server1.toLocaleString()}
                        </div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          <svg
                            className="w-3 h-3 self-center"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 10l7-7m0 0l7 7m-7-7v18"
                            />
                          </svg>
                          <span className="ml-1">12%</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all hover:shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-emerald-50">
                    <svg
                      className="w-6 h-6 text-emerald-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{successRate.server1.toFixed(1)}%</div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          <svg
                            className="w-3 h-3 self-center"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 10l7-7m0 0l7 7m-7-7v18"
                            />
                          </svg>
                          <span className="ml-1">3.2%</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all hover:shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-amber-50">
                    <svg
                      className="w-6 h-6 text-amber-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg Response Time</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{avgResponseTimes.server1}ms</div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                          <svg
                            className="w-3 h-3 self-center"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                          </svg>
                          <span className="ml-1">8%</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all hover:shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-red-50">
                    <svg
                      className="w-6 h-6 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Error Rate</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {getErrorRateData()[0].server1.toFixed(1)}%
                        </div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          <svg
                            className="w-3 h-3 self-center"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 10l7-7m0 0l7 7m-7-7v18"
                            />
                          </svg>
                          <span className="ml-1">1.5%</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Hourly Traffic Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Hourly Traffic</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-indigo-500 mr-1.5"></div>
                        <span className="text-xs text-gray-600">Server 1</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-emerald-500 mr-1.5"></div>
                        <span className="text-xs text-gray-600">Server 2</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {isDataEmpty(getHourlyData()) ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                      <svg
                        className="w-12 h-12 mb-3 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm">No traffic data available for this time period</p>
                      <button
                        onClick={generateHourlyTrafficData}
                        className="mt-3 px-4 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                      >
                        Generate Test Data
                      </button>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={getHourlyData()}>
                        <defs>
                          <linearGradient id="colorServer1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorServer2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="hour"
                          tick={{ fontSize: 12, fill: "#6B7280" }}
                          tickLine={{ stroke: "#E5E7EB" }}
                          axisLine={{ stroke: "#E5E7EB" }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: "#6B7280" }}
                          tickLine={{ stroke: "#E5E7EB" }}
                          axisLine={{ stroke: "#E5E7EB" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                            border: "1px solid #E5E7EB",
                          }}
                          itemStyle={{ padding: "2px 0" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="server1"
                          stroke="#6366F1"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{
                            r: 6,
                            stroke: "#6366F1",
                            strokeWidth: 2,
                            fill: "white",
                          }}
                          name="Server 1 (Rate Limited)"
                          fill="url(#colorServer1)"
                        />
                        <Line
                          type="monotone"
                          dataKey="server2"
                          stroke="#10B981"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{
                            r: 6,
                            stroke: "#10B981",
                            strokeWidth: 2,
                            fill: "white",
                          }}
                          name="Server 2 (No Rate Limit)"
                          fill="url(#colorServer2)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={generateHourlyTrafficData}
                      className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                    >
                      Generate Test Data
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Distribution */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Status Codes</h3>
                    <div className="flex items-center space-x-2">
                      <button className="text-xs font-medium text-gray-500 px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors">
                        Last 24h
                      </button>
                      <button className="text-xs font-medium text-gray-500 px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors">
                        Last 7d
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  { isDataEmpty(getStatusData()) ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                      <svg
                        className="w-12 h-12 mb-3 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm">No status data available</p>
                      <button
                        onClick={generateTestData}
                        className="mt-3 px-4 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                      >
                        Generate Test Data
                      </button>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getStatusData()}>
                      {console.log("Datos para el gráfico:", getStatusData())}
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: "#6B7280" }}
                          tickLine={{ stroke: "#E5E7EB" }}
                          axisLine={{ stroke: "#E5E7EB" }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: "#6B7280" }}
                          tickLine={{ stroke: "#E5E7EB" }}
                          axisLine={{ stroke: "#E5E7EB" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                            border: "1px solid #E5E7EB",
                          }}
                          itemStyle={{ padding: "2px 0" }}
                        />
                        <Bar dataKey="server1" fill="#6366F1" name="Server 1 (Rate Limited)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="server2" fill="#10B981" name="Server 2 (No Rate Limit)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Traffic Tab Content */}
        {activeTab === "traffic" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hourly Traffic Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Hourly Traffic</h3>
                  </div>
                </div>
                <div className="p-6">
                  {isDataEmpty(getHourlyData()) ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                      <svg
                        className="w-12 h-12 mb-3 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm">No traffic data available for this time period</p>
                      <button
                        onClick={generateTestData}
                        className="mt-3 px-4 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                      >
                        Generate Test Data
                      </button>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={getHourlyData()}>
                        <defs>
                          <linearGradient id="colorServer1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorServer2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="hour"
                          tick={{ fontSize: 12, fill: "#6B7280" }}
                          tickLine={{ stroke: "#E5E7EB" }}
                          axisLine={{ stroke: "#E5E7EB" }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: "#6B7280" }}
                          tickLine={{ stroke: "#E5E7EB" }}
                          axisLine={{ stroke: "#E5E7EB" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                            border: "1px solid #E5E7EB",
                          }}
                          itemStyle={{ padding: "2px 0" }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="server1"
                          stroke="#6366F1"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{
                            r: 6,
                            stroke: "#6366F1",
                            strokeWidth: 2,
                            fill: "white",
                          }}
                          name="Server 1 (Rate Limited)"
                          fill="url(#colorServer1)"
                        />
                        <Line
                          type="monotone"
                          dataKey="server2"
                          stroke="#10B981"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{
                            r: 6,
                            stroke: "#10B981",
                            strokeWidth: 2,
                            fill: "white",
                          }}
                          name="Server 2 (No Rate Limit)"
                          fill="url(#colorServer2)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={generateHourlyTrafficData}
                      className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                    >
                      Generate Test Data
                    </button>
                  </div>
                </div>
              </div>

              {/* HTTP Methods */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">HTTP Methods</h3>
                </div>
                <div className="p-6">
                  {isDataEmpty(getMethodData()) ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                      <svg
                        className="w-12 h-12 mb-3 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm">No HTTP method data available</p>
                      <button
                        onClick={generateTestData}
                        className="mt-3 px-4 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                      >
                        Generate Test Data
                      </button>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getMethodData()} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 12, fill: "#6B7280" }}
                          tickLine={{ stroke: "#E5E7EB" }}
                          axisLine={{ stroke: "#E5E7EB" }}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fontSize: 12, fill: "#6B7280" }}
                          tickLine={{ stroke: "#E5E7EB" }}
                          axisLine={{ stroke: "#E5E7EB" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                            border: "1px solid #E5E7EB",
                          }}
                          itemStyle={{ padding: "2px 0" }}
                        />
                        <Legend />
                        <Bar dataKey="server1" fill="#6366F1" name="Server 1 (Rate Limited)" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="server2" fill="#10B981" name="Server 2 (No Rate Limit)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Path Usage Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Top 5 Endpoints</h3>
              </div>
              <div className="p-6">
                {isDataEmpty(getPathUsageData()) ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                    <svg
                      className="w-12 h-12 mb-3 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm">No path usage data available</p>
                    <button
                      onClick={generateTestData}
                      className="mt-3 px-4 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                    >
                      Generate Test Data
                    </button>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getPathUsageData()} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                        tickLine={{ stroke: "#E5E7EB" }}
                        axisLine={{ stroke: "#E5E7EB" }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                        tickLine={{ stroke: "#E5E7EB" }}
                        axisLine={{ stroke: "#E5E7EB" }}
                        width={150}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          borderRadius: "0.5rem",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                          border: "1px solid #E5E7EB",
                        }}
                        itemStyle={{ padding: "2px 0" }}
                      />
                      <Legend />
                      <Bar dataKey="server1" fill="#6366F1" name="Server 1 (Rate Limited)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="server2" fill="#10B981" name="Server 2 (No Rate Limit)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab Content */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Response Time Distribution */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Response Time Distribution</h3>
                </div>
                <div className="p-6">
                  {isDataEmpty(getResponseTimeData()) ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                      <svg
                        className="w-12 h-12 mb-3 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm">No response time data available</p>
                      <button
                        onClick={generateTestData}
                        className="mt-3 px-4 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                      >
                        Generate Test Data
                      </button>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getResponseTimeData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: "#6B7280" }}
                          tickLine={{ stroke: "#E5E7EB" }}
                          axisLine={{ stroke: "#E5E7EB" }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: "#6B7280" }}
                          tickLine={{ stroke: "#E5E7EB" }}
                          axisLine={{ stroke: "#E5E7EB" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                            border: "1px solid #E5E7EB",
                          }}
                          itemStyle={{ padding: "2px 0" }}
                        />
                        <Legend />
                        <Bar dataKey="server1" fill="#6366F1" name="Server 1 (Rate Limited)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="server2" fill="#10B981" name="Server 2 (No Rate Limit)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Memory Usage Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Memory Usage (MB)</h3>
                </div>
                <div className="p-6">
                  {isDataEmpty(getMemoryUsageData()) ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                      <svg
                        className="w-12 h-12 mb-3 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm">No memory usage data available</p>
                      <button
                        onClick={generateTestData}
                        className="mt-3 px-4 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                      >
                        Generate Test Data
                      </button>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getMemoryUsageData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: "#6B7280" }}
                          tickLine={{ stroke: "#E5E7EB" }}
                          axisLine={{ stroke: "#E5E7EB" }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: "#6B7280" }}
                          tickLine={{ stroke: "#E5E7EB" }}
                          axisLine={{ stroke: "#E5E7EB" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                            border: "1px solid #E5E7EB",
                          }}
                          formatter={(value) => [`${value.toFixed(2)} MB`, null]}
                          itemStyle={{ padding: "2px 0" }}
                        />
                        <Legend />
                        <Bar dataKey="server1" fill="#6366F1" name="Server 1 (Rate Limited)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="server2" fill="#10B981" name="Server 2 (No Rate Limit)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                   <div className="mt-4 flex justify-center">
                    <button
                      onClick={generateTestData}
                      className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                    >
                      Generate Test Data
                    </button>
                  </div>
                  
                </div>
                
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Performance Summary</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-4">
                    <h4 className="text-base font-medium text-indigo-700 mb-2">Server 1 (Rate Limited)</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-indigo-600">Response Time</span>
                          <span className="text-xs font-medium text-indigo-600">{avgResponseTimes.server1}ms</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2">
                          <div
                            className="bg-indigo-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (avgResponseTimes.server1 / 500) * 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-indigo-600">Success Rate</span>
                          <span className="text-xs font-medium text-indigo-600">{successRate.server1.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2">
                          <div
                            className="bg-indigo-500 h-2 rounded-full"
                            style={{ width: `${successRate.server1}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-indigo-600">Error Rate</span>
                          <span className="text-xs font-medium text-indigo-600">
                            {getErrorRateData()[0].server1.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${getErrorRateData()[0].server1}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-4">
                    <h4 className="text-base font-medium text-emerald-700 mb-2">Server 2 (No Rate Limit)</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-emerald-600">Response Time</span>
                          <span className="text-xs font-medium text-emerald-600">{avgResponseTimes.server2}ms</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (avgResponseTimes.server2 / 500) * 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-emerald-600">Success Rate</span>
                          <span className="text-xs font-medium text-emerald-600">
                            {successRate.server2.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{ width: `${successRate.server2}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-emerald-600">Error Rate</span>
                          <span className="text-xs font-medium text-emerald-600">
                            {getErrorRateData()[0].server2.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${getErrorRateData()[0].server2}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-500">Comparison</span>
                    <span className="font-medium text-gray-900">
                      {avgResponseTimes.server1 < avgResponseTimes.server2
                        ? "Server 1 is faster"
                        : "Server 2 is faster"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="font-medium text-gray-500">Difference</span>
                    <span className="font-medium text-gray-900">
                      {Math.abs(avgResponseTimes.server1 - avgResponseTimes.server2)}
                      ms
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab Content */}
        {activeTab === "logs" && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Log Search</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by path, method, status, or log level..."
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={generateTestData}
                      className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                    >
                      Generate Test Data
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Log Levels Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Log Levels by Server</h3>
              </div>
              <div className="p-6">
                {isDataEmpty(getLogLevelData()) ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                    <svg
                      className="w-12 h-12 mb-3 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm">No log level data available</p>
                    <button
                      onClick={generateTestData}
                      className="mt-3 px-4 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                    >
                      Generate Test Data
                    </button>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getLogLevelData()} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                        tickLine={{ stroke: "#E5E7EB" }}
                        axisLine={{ stroke: "#E5E7EB" }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                        tickLine={{ stroke: "#E5E7EB" }}
                        axisLine={{ stroke: "#E5E7EB" }}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          borderRadius: "0.5rem",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                          border: "1px solid #E5E7EB",
                        }}
                        itemStyle={{ padding: "2px 0" }}
                      />
                      <Legend />
                      <Bar dataKey="server1" fill="#6366F1" name="Server 1 (Rate Limited)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="server2" fill="#10B981" name="Server 2 (No Rate Limit)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Log Entries</h3>
                  <span className="text-sm text-gray-500">
                    Showing {currentLogs.length} of {filteredLogs.length} logs
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Server
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Method
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Path
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Level
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          No logs found matching your criteria
                        </td>
                      </tr>
                    ) : (
                      currentLogs.map((log, index) => (
                        <tr key={log.id || index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className={`h-2.5 w-2.5 rounded-full ${
                                  log.serverId === 2 ? "bg-emerald-400" : "bg-indigo-400"
                                } mr-2`}
                              ></div>
                              <span className="text-sm text-gray-900">
                                {log.serverId === 2 ? "Server 2" : "Server 1"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                log.method === "GET"
                                  ? "bg-blue-100 text-blue-800"
                                  : log.method === "POST"
                                    ? "bg-green-100 text-green-800"
                                    : log.method === "PUT"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : log.method === "DELETE"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {log.method}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.path || "/"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                log.logLevel === "error"
                                  ? "bg-red-100 text-red-800"
                                  : log.logLevel === "warn"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : log.logLevel === "info"
                                      ? "bg-blue-100 text-blue-800"
                                      : log.logLevel === "debug"
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {log.logLevel || "info"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                log.status < 300
                                  ? "bg-green-100 text-green-800"
                                  : log.status < 400
                                    ? "bg-blue-100 text-blue-800"
                                    : log.status < 500
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatLogTimestamp(log.timestamp)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-3 py-1 text-sm text-white bg-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Errors Tab Content */}
        {activeTab === "errors" && (
          <div className="space-y-6">
            {/* Error Rate Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Error Rate (%)</h3>
              </div>
              <div className="p-6">
                {isDataEmpty(getErrorRateData()) ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                    <svg
                      className="w-12 h-12 mb-3 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm">No error rate data available</p>
                    <button
                      onClick={generateErrorData}
                      className="mt-3 px-4 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                    >
                      Generate Test Data
                    </button>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getErrorRateData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                        tickLine={{ stroke: "#E5E7EB" }}
                        axisLine={{ stroke: "#E5E7EB" }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                        tickLine={{ stroke: "#E5E7EB" }}
                        axisLine={{ stroke: "#E5E7EB" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          borderRadius: "0.5rem",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                          border: "1px solid #E5E7EB",
                        }}
                        itemStyle={{ padding: "2px 0" }}
                      />
                      <Legend />
                      <Bar dataKey="server1" fill="#6366F1" name="Server 1 (Rate Limited)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="server2" fill="#10B981" name="Server 2 (No Rate Limit)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Errors by Status Code */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Errors by Status Code</h3>
              </div>
              <div className="p-6">
                {isDataEmpty(getErrorsByStatusCode()) ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                    <svg
                      className="w-12 h-12 mb-3 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm">No error data available</p>
                    <button
                      onClick={generateErrorData}
                      className="mt-3 px-4 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                    >
                      Generate Test Data
                    </button>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getErrorsByStatusCode()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                        tickLine={{ stroke: "#E5E7EB" }}
                        axisLine={{ stroke: "#E5E7EB" }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                        tickLine={{ stroke: "#E5E7EB" }}
                        axisLine={{ stroke: "#E5E7EB" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          borderRadius: "0.5rem",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                          border: "1px solid #E5E7EB",
                        }}
                        itemStyle={{ padding: "2px 0" }}
                      />
                      <Legend />
                      <Bar dataKey="server1" fill="#6366F1" name="Server 1 (Rate Limited)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="server2" fill="#10B981" name="Server 2 (No Rate Limit)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Error Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Error Logs</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Server
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Method
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Path
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs
                      .filter((log) => log.status >= 400)
                      .slice(0, 10)
                      .map((log, index) => (
                        <tr key={log.id || index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className={`h-2.5 w-2.5 rounded-full ${
                                  log.serverId === 2 ? "bg-emerald-400" : "bg-indigo-400"
                                } mr-2`}
                              ></div>
                              <span className="text-sm text-gray-900">
                                {log.serverId === 2 ? "Server 2" : "Server 1"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                log.method === "GET"
                                  ? "bg-blue-100 text-blue-800"
                                  : log.method === "POST"
                                    ? "bg-green-100 text-green-800"
                                    : log.method === "PUT"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : log.method === "DELETE"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {log.method}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.path || "/"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                log.status < 500 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatLogTimestamp(log.timestamp)}
                          </td>
                        </tr>
                      ))}
                    {filteredLogs.filter((log) => log.status >= 400).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          No error logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-1">
              <div className="h-6 w-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                M
              </div>
              <span className="text-sm text-gray-500">Server Analytics Dashboard</span>
            </div>
            <div className="mt-4 md:mt-0 text-sm text-gray-500">
              &copy; {new Date().getFullYear()} {info?.student?.fullName || "Student"} -{" "}
              {info?.student?.group || "Group"}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Dashboard
