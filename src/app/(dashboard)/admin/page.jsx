'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'

import { Card, CardContent, Typography, Grid, Box, CircularProgress, Alert, Button, Paper } from '@mui/material'
import {
  People as PeopleIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  EventNote as EventNoteIcon
} from '@mui/icons-material'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRoles: 0,
    totalLogs: 0,
    recentLogs: []
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)

      // Fetch users
      const usersResponse = await fetch('/api/admin/users')
      const usersData = await usersResponse.json()

      // Fetch roles
      const rolesResponse = await fetch('/api/admin/roles')
      const rolesData = await rolesResponse.json()

      // Fetch recent logs
      const logsResponse = await fetch('/api/admin/audit-logs?limit=10')
      const logsData = await logsResponse.json()

      setStats({
        totalUsers: usersData.success ? usersData.users.length : 0,
        totalRoles: rolesData.success ? rolesData.roles.length : 0,
        totalLogs: logsData.success ? logsData.pagination.totalLogs : 0,
        recentLogs: logsData.success ? logsData.logs : []
      })
    } catch (err) {
      setError('فشل في تحميل الإحصائيات')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, link }) => (
    <Card sx={{ height: '100%', cursor: link ? 'pointer' : 'default' }}>
      <CardContent>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Box>
            <Typography color='textSecondary' gutterBottom variant='body2'>
              {title}
            </Typography>
            <Typography variant='h4' component='div'>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: 2,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon sx={{ fontSize: 40, color: `${color}.main` }} />
          </Box>
        </Box>
        {link && (
          <Button component={Link} href={link} size='small' sx={{ mt: 2 }} fullWidth variant='outlined'>
            عرض التفاصيل
          </Button>
        )}
      </CardContent>
    </Card>
  )

  const getActionColor = action => {
    const actionColors = {
      USER_LOGIN: 'success',
      USER_LOGOUT: 'info',
      USER_CREATED: 'primary',
      USER_UPDATED: 'warning',
      USER_DELETED: 'error',
      ROLE_CREATED: 'primary',
      ROLE_UPDATED: 'warning',
      ROLE_DELETED: 'error'
    }

    return actionColors[action] || 'default'
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        لوحة تحكم الإدارة
      </Typography>
      <Typography variant='body2' color='textSecondary' paragraph>
        إدارة المستخدمين والأدوار ومراقبة أنشطة النظام
      </Typography>

      {error && (
        <Alert severity='error' onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title='إجمالي المستخدمين'
            value={stats.totalUsers}
            icon={PeopleIcon}
            color='primary'
            link='/admin/users'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title='الأدوار والصلاحيات'
            value={stats.totalRoles}
            icon={SecurityIcon}
            color='success'
            link='/admin/roles'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title='سجلات الأنشطة'
            value={stats.totalLogs}
            icon={AssessmentIcon}
            color='warning'
            link='/admin/audit-logs'
          />
        </Grid>
      </Grid>

      {/* Quick Links */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' mb={2}>
                <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant='h6'>إدارة المستخدمين</Typography>
              </Box>
              <Typography variant='body2' color='textSecondary' paragraph>
                عرض وتعديل وحذف المستخدمين، تعيين الأدوار والصلاحيات
              </Typography>
              <Button component={Link} href='/admin/users' variant='contained' fullWidth>
                فتح
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' mb={2}>
                <SecurityIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant='h6'>إدارة الأدوار</Typography>
              </Box>
              <Typography variant='body2' color='textSecondary' paragraph>
                إنشاء وتعديل الأدوار والصلاحيات المختلفة
              </Typography>
              <Button component={Link} href='/admin/roles' variant='contained' color='success' fullWidth>
                فتح
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center' mb={2}>
                <SecurityIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant='h6'>تعديل الصلاحيات</Typography>
              </Box>
              <Typography variant='body2' color='textSecondary' paragraph>
                التحكم في الصفحات والصلاحيات المتاحة لكل دور
              </Typography>
              <Button component={Link} href='/admin/permissions' variant='contained' color='info' fullWidth>
                فتح
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Guide */}
      <Card sx={{ mb: 4, bgcolor: 'info.lighter' }}>
        <CardContent>
          <Typography variant='h6' gutterBottom color='info.main'>
            📋 دليل سريع: إدارة الأدوار والصلاحيات
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant='subtitle2' color='primary' gutterBottom>
                  1️⃣ إنشاء الأدوار
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  انتقل إلى <strong>إدارة الأدوار</strong> لإنشاء أدوار جديدة مثل (محاسب، مدير مخزون، إلخ)
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant='subtitle2' color='success.main' gutterBottom>
                  2️⃣ تحديد الصلاحيات
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  في صفحة <strong>تعديل الصلاحيات</strong>، حدد الصفحات المسموح بها لكل دور
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant='subtitle2' color='warning.main' gutterBottom>
                  3️⃣ تعيين الأدوار للمستخدمين
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  في <strong>إدارة المستخدمين</strong>، قم بتعيين الأدوار المناسبة لكل مستخدم
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Alert severity='info' sx={{ mt: 1 }}>
                <strong>ملاحظة:</strong> المستخدمون الذين لديهم دور "admin" يمكنهم الوصول لجميع الصفحات تلقائياً.
                المستخدمون الآخرون يمكنهم تخصيص القوائم المرئية من صفحة الإعدادات.
              </Alert>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardContent>
          <Box display='flex' alignItems='center' justifyContent='space-between' mb={2}>
            <Typography variant='h6'>
              <EventNoteIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              آخر الأنشطة
            </Typography>
            <Button component={Link} href='/admin/audit-logs' size='small'>
              عرض الكل
            </Button>
          </Box>

          {stats.recentLogs.length === 0 ? (
            <Typography variant='body2' color='textSecondary' align='center' py={4}>
              لا توجد أنشطة حديثة
            </Typography>
          ) : (
            <Box>
              {stats.recentLogs.map(log => (
                <Paper key={log.id} variant='outlined' sx={{ p: 2, mb: 1, '&:last-child': { mb: 0 } }}>
                  <Grid container spacing={2} alignItems='center'>
                    <Grid item xs={12} sm={3}>
                      <Typography variant='body2' fontWeight='bold'>
                        {log.user?.name || 'غير معروف'}
                      </Typography>
                      <Typography variant='caption' color='textSecondary'>
                        {log.user?.email}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant='body2'>{log.action}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant='caption' color='textSecondary'>
                        {log.details}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant='caption' color='textSecondary'>
                        {new Date(log.createdAt).toLocaleString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
