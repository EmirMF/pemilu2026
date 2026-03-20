# Rencana Optimasi Production - Aplikasi Pemilu

## Ringkasan Masalah
- **Platform**: Vercel
- **Estimasi User**: ~200 concurrent users
- **Masalah Utama**: 
  - Login terasa lambat
  - Load dashboard lambat
  - Load data lebih lambat dari development
- **Redis**: Belum disetup di production

## Analisis Root Cause

### 1. Database Performance Issues
- Tidak ada connection pooling yang optimal
- Missing database indexes untuk query yang sering digunakan
- Query tidak dioptimasi (select all fields)
- Tidak ada caching layer

### 2. Next.js Configuration
- [`next.config.ts`](next.config.ts:1) masih default/minimal
- Tidak ada optimasi build
- Tidak ada ISR untuk halaman publik

### 3. API Routes
- Setiap request hit database langsung
- Tidak ada response caching
- Query tidak parallel
- Tidak ada pagination untuk data besar

### 4. Frontend Performance
- Komponen berat (framer-motion, GSAP) di-load semuanya
- Tidak ada code splitting
- Tidak ada lazy loading untuk dashboard components

## Prioritas Optimasi (Berdasarkan Impact)

### 🔴 HIGH PRIORITY (Quick Wins - Implementasi Dulu)

#### 1. Setup Redis untuk Caching
**Impact**: Sangat tinggi - mengurangi database load 60-80%
**Files**: [`redis.ts`](src/lib/redis.ts:1)

Setup Upstash Redis (free tier cukup untuk 200 users):
```bash
# Install Upstash Redis SDK (sudah ada ioredis)
npm install @upstash/redis
```

Environment variables yang dibutuhkan:
```env
REDIS_URL=your_upstash_redis_url
REDIS_TOKEN=your_upstash_token
```

#### 2. Database Indexes
**Impact**: Sangat tinggi - mempercepat query 5-10x
**Files**: [`schema.prisma`](prisma/schema.prisma:1)

Tambahkan indexes untuk:
- `Voter.email` (sudah unique, tapi perlu index untuk lookup)
- `Voter.hasVoted` (untuk filter)
- `VoteRecord.candidateId` (untuk aggregation)
- `AuditLog.action`, `actorNim`, `createdAt`, `status` (sudah ada)
- `Whitelist.nim` (sudah unique)

#### 3. Optimasi [`getElectionSettings()`](src/lib/election.ts:1)
**Impact**: Tinggi - dipanggil di hampir setiap request
**Files**: [`election.ts`](src/lib/election.ts:1)

Implementasi caching dengan TTL 30 detik:
```typescript
// Cache settings untuk mengurangi database hits
const CACHE_KEY = 'election:settings'
const CACHE_TTL = 30 // seconds
```

#### 4. Optimasi API Routes dengan Caching
**Impact**: Tinggi - mengurangi response time 70-90%
**Files**: 
- [`/api/results/route.ts`](src/app/api/results/route.ts:1)
- [`/api/candidates/route.ts`](src/app/api/candidates/route.ts:1)
- [`/api/auth/session/route.ts`](src/app/api/auth/session/route.ts:1)

Tambahkan cache headers dan Redis caching.

#### 5. Database Connection Pooling
**Impact**: Tinggi - mencegah connection exhaustion
**Files**: [`prisma.ts`](src/lib/prisma.ts:1)

Konfigurasi connection pool untuk Vercel:
```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Vercel serverless optimization
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})
```

### 🟡 MEDIUM PRIORITY (Implementasi Setelah High Priority)

#### 6. Next.js Configuration
**Impact**: Medium - mempercepat build dan runtime
**Files**: [`next.config.ts`](next.config.ts:1)

```typescript
const nextConfig: NextConfig = {
  // Compression
  compress: true,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/api/results',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=10, stale-while-revalidate=30' },
        ],
      },
    ]
  },
}
```

#### 7. Optimasi Database Queries
**Impact**: Medium - mengurangi data transfer
**Files**: Semua API routes

Gunakan `select` untuk ambil field yang dibutuhkan saja:
```typescript
// Before
const voters = await prisma.voter.findMany()

// After
const voters = await prisma.voter.findMany({
  select: {
    id: true,
    nim: true,
    name: true,
    hasVoted: true,
  }
})
```

#### 8. Parallel Queries di Dashboard
**Impact**: Medium - mengurangi loading time 40-50%
**Files**: [`/dashboard/page.tsx`](src/app/dashboard/page.tsx:1)

Gunakan `Promise.all` untuk query parallel.

#### 9. Dynamic Imports untuk Komponen Berat
**Impact**: Medium - mengurangi initial bundle size
**Files**: 
- [`layout.tsx`](src/app/layout.tsx:1)
- Dashboard components

```typescript
import dynamic from 'next/dynamic'

const DashboardClient = dynamic(() => import('./DashboardClient'), {
  loading: () => <LoadingSpinner />,
  ssr: false
})
```

#### 10. Font Loading Optimization
**Impact**: Medium - mengurangi CLS dan loading time
**Files**: [`layout.tsx`](src/app/layout.tsx:1)

```typescript
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Add this
  preload: true,
})
```

### 🟢 LOW PRIORITY (Nice to Have)

#### 11. ISR untuk Halaman Publik
**Impact**: Low-Medium - untuk halaman yang jarang berubah
**Files**: [`page.tsx`](src/app/page.tsx:1), [`/peraturan/page.tsx`](src/app/peraturan/page.tsx:1)

```typescript
export const revalidate = 60 // Revalidate every 60 seconds
```

#### 12. React Performance Optimization
**Impact**: Low - untuk UX yang lebih smooth
**Files**: [`DashboardClient.tsx`](src/app/dashboard/DashboardClient.tsx:1)

Gunakan `useMemo` dan `useCallback` untuk expensive computations.

#### 13. Virtual Scrolling
**Impact**: Low - hanya jika list sangat panjang (>1000 items)
**Files**: [`UsersClient.tsx`](src/app/dashboard/users/UsersClient.tsx:1), [`VotersClient.tsx`](src/app/dashboard/voters/VotersClient.tsx:1)

Implementasi dengan `react-window` atau `react-virtual`.

#### 14. Error Boundary & Monitoring
**Impact**: Low - untuk debugging dan monitoring
**Files**: New files

Setup Vercel Analytics atau Sentry untuk monitoring.

## Implementation Order

### Week 1: Critical Performance Fixes
1. ✅ Setup Upstash Redis di Vercel
2. ✅ Tambahkan database indexes
3. ✅ Implementasi caching untuk `getElectionSettings()`
4. ✅ Optimasi database connection pooling
5. ✅ Cache API routes (`/api/results`, `/api/candidates`)

### Week 2: Configuration & Query Optimization
6. ✅ Konfigurasi [`next.config.ts`](next.config.ts:1)
7. ✅ Optimasi database queries (select specific fields)
8. ✅ Implementasi parallel queries di dashboard
9. ✅ Cache `/api/auth/session`
10. ✅ Dynamic imports untuk komponen berat

### Week 3: Frontend & Polish
11. ✅ Font loading optimization
12. ✅ React performance optimization (useMemo, useCallback)
13. ✅ ISR untuk halaman publik
14. ✅ Setup monitoring

## Expected Performance Improvements

### Before Optimization
- Login: 2-3 detik
- Dashboard load: 3-5 detik
- API response: 500-1000ms

### After Optimization (Target)
- Login: 0.5-1 detik (50-70% faster)
- Dashboard load: 1-2 detik (60-70% faster)
- API response: 100-300ms (70-80% faster)

## Vercel-Specific Considerations

### 1. Serverless Function Limits
- Max execution time: 10s (Hobby), 60s (Pro)
- Max payload: 4.5MB
- Cold start: ~100-500ms

**Solution**: 
- Keep functions small and focused
- Use Edge Functions untuk API yang sering diakses
- Implement proper caching

### 2. Database Connection Pooling
Vercel serverless functions create new connections per invocation.

**Solution**:
- Use connection pooling di Prisma
- Consider using PgBouncer atau MongoDB connection pooling
- Implement proper connection management

### 3. Region Selection
Pilih region terdekat dengan majority users (Indonesia).

**Recommended**: Singapore (sin1) untuk users Indonesia

### 4. Environment Variables
Setup di Vercel Dashboard:
```
DATABASE_URL=mongodb://...
REDIS_URL=redis://...
REDIS_TOKEN=...
NEXTAUTH_SECRET=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

## Monitoring & Metrics

### Key Metrics to Track
1. **Response Time**: Target <300ms untuk API routes
2. **Database Query Time**: Target <100ms per query
3. **Cache Hit Rate**: Target >80%
4. **Error Rate**: Target <1%
5. **Concurrent Users**: Monitor untuk scaling

### Tools
- Vercel Analytics (built-in)
- Vercel Speed Insights
- Prisma Query Logging
- Redis monitoring (Upstash dashboard)

## Cost Estimation

### Upstash Redis (Free Tier)
- 10,000 commands/day
- 256MB storage
- Cukup untuk 200 concurrent users

### Vercel (Hobby Plan)
- 100GB bandwidth/month
- Unlimited requests
- Cukup untuk aplikasi pemilu

**Total Cost**: $0/month (menggunakan free tiers)

## Rollback Plan

Jika ada masalah setelah deployment:

1. **Redis Issues**: Fallback ke database langsung
2. **Caching Issues**: Clear cache atau disable caching
3. **Performance Regression**: Revert ke commit sebelumnya

## Next Steps

1. Review plan ini dengan team
2. Setup Upstash Redis account
3. Mulai implementasi dari High Priority items
4. Test di staging environment
5. Deploy ke production secara bertahap
6. Monitor metrics dan adjust

---

**Catatan**: Plan ini dibuat berdasarkan analisis codebase dan best practices untuk Next.js + Vercel deployment. Adjust sesuai kebutuhan spesifik aplikasi Anda.
