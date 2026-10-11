import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { searchListings, getLocationFacets, getAmenities } from '../../api/properties.api.js'
import { PropertyCard } from '../../components/property/PropertyCard.jsx'
import { SkeletonCard } from '../../components/common/LoadingSpinner.jsx'
import { EmptyState } from '../../components/common/EmptyState.jsx'
import { ErrorState } from '../../components/common/ErrorState.jsx'

const PAGE_SIZE = 12

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    area: searchParams.get('area') || '',
    city: searchParams.get('city') || '',
    district: searchParams.get('district') || '',
    min_rent: searchParams.get('min_rent') || '',
    max_rent: searchParams.get('max_rent') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    bathrooms: searchParams.get('bathrooms') || '',
    category: searchParams.get('category') || '',
    furnishing: searchParams.get('furnishing') || '',
    unit_type: searchParams.get('unit_type') || '',
    available_from: searchParams.get('available_from') || '',
    amenity: searchParams.get('amenity') || '',
    preferred_tenant: searchParams.get('preferred_tenant') || '',
  })
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))

  const { data: locations } = useQuery({
    queryKey: ['location-facets'],
    queryFn: getLocationFacets,
    staleTime: 5 * 60 * 1000,
  })

  const { data: amenities } = useQuery({
    queryKey: ['amenities'],
    queryFn: getAmenities,
    staleTime: 5 * 60 * 1000,
  })

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['listings', filters, page],
    queryFn: () => searchListings({ ...filters, page, page_size: PAGE_SIZE }),
  })

  const updateFilters = useCallback(
    (key, value) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
      setPage(1)
    },
    [],
  )

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    if (page > 1) params.set('page', String(page))
    setSearchParams(params)
  }, [filters, page, setSearchParams])

  useEffect(() => {
    applyFilters()
  }, [filters, page])

  const resetFilters = () => {
    setFilters({
      search: '',
      area: '',
      city: '',
      district: '',
      min_rent: '',
      max_rent: '',
      bedrooms: '',
      bathrooms: '',
      category: '',
      furnishing: '',
      unit_type: '',
      available_from: '',
      amenity: '',
      preferred_tenant: '',
    })
    setPage(1)
    setSearchParams({})
  }

  const results = data?.results || []
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0

  return (
    <div className="container" style={{ padding: 'var(--space-8) 0' }}>
      <h1 style={{ marginBottom: 'var(--space-8)' }}>Search Properties</h1>

      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
        {/* Filters sidebar */}
        <div style={{ flex: '0 0 280px', minWidth: '260px' }}>
          <div className="card" style={{ padding: 'var(--space-6)', position: 'sticky', top: 'calc(var(--header-height) + var(--space-4))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Filters</h3>
              <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: 'var(--color-brand-600)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                Reset all
              </button>
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label htmlFor="filter-search" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Search</label>
              <input id="filter-search" type="text" className="input" placeholder="Keyword..." value={filters.search} onChange={(e) => updateFilters('search', e.target.value)} />
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label htmlFor="filter-area" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Area</label>
              <input id="filter-area" type="text" className="input" placeholder="Area, city, or neighborhood" value={filters.area} onChange={(e) => updateFilters('area', e.target.value)} />
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label htmlFor="filter-district" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>District</label>
              <select id="filter-district" className="select" value={filters.district} onChange={(e) => updateFilters('district', e.target.value)}>
                <option value="">All districts</option>
                {locations?.districts?.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label htmlFor="filter-min-rent" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Min Rent (BDT)</label>
              <input id="filter-min-rent" type="number" className="input" placeholder="0" value={filters.min_rent} onChange={(e) => updateFilters('min_rent', e.target.value)} />
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label htmlFor="filter-max-rent" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Max Rent (BDT)</label>
              <input id="filter-max-rent" type="number" className="input" placeholder="Any" value={filters.max_rent} onChange={(e) => updateFilters('max_rent', e.target.value)} />
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label htmlFor="filter-bedrooms" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Bedrooms</label>
              <select id="filter-bedrooms" className="select" value={filters.bedrooms} onChange={(e) => updateFilters('bedrooms', e.target.value)}>
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label htmlFor="filter-bathrooms" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Bathrooms</label>
              <select id="filter-bathrooms" className="select" value={filters.bathrooms} onChange={(e) => updateFilters('bathrooms', e.target.value)}>
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
              </select>
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label htmlFor="filter-category" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Property Type</label>
              <select id="filter-category" className="select" value={filters.category} onChange={(e) => updateFilters('category', e.target.value)}>
                <option value="">All types</option>
                <option value="apartment_building">Apartment Building</option>
                <option value="standalone_house">Standalone House</option>
                <option value="duplex">Duplex</option>
                <option value="studio_building">Studio Building</option>
                <option value="commercial">Commercial</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label htmlFor="filter-furnishing" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Furnishing</label>
              <select id="filter-furnishing" className="select" value={filters.furnishing} onChange={(e) => updateFilters('furnishing', e.target.value)}>
                <option value="">Any</option>
                <option value="unfurnished">Unfurnished</option>
                <option value="semi_furnished">Semi Furnished</option>
                <option value="fully_furnished">Fully Furnished</option>
              </select>
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label htmlFor="filter-unit-type" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Unit Type</label>
              <select id="filter-unit-type" className="select" value={filters.unit_type} onChange={(e) => updateFilters('unit_type', e.target.value)}>
                <option value="">All types</option>
                <option value="apartment">Apartment</option>
                <option value="duplex">Duplex</option>
                <option value="studio">Studio</option>
                <option value="room">Room</option>
                <option value="standalone_house">Standalone House</option>
              </select>
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label htmlFor="filter-tenant" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>Preferred Tenant</label>
              <select id="filter-tenant" className="select" value={filters.preferred_tenant} onChange={(e) => updateFilters('preferred_tenant', e.target.value)}>
                <option value="">Any</option>
                <option value="family">Family</option>
                <option value="bachelor">Bachelor</option>
                <option value="corporate">Corporate</option>
                <option value="student">Student</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <p style={{ margin: 0, color: 'var(--color-neutral-600)' }}>
              {isLoading ? 'Searching...' : `${data?.count || 0} properties found`}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <label htmlFor="sort-order" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>Sort:</label>
              <select id="sort-order" className="select" style={{ width: 'auto', padding: 'var(--space-2) var(--space-3)' }} value={searchParams.get('ordering') || '-created_at'} onChange={(e) => updateFilters('ordering', e.target.value)}>
                <option value="-created_at">Newest first</option>
                <option value="monthly_rent">Price: Low to High</option>
                <option value="-monthly_rent">Price: High to Low</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : isError ? (
            <ErrorState title="Failed to load properties" description={error?.message || 'Please try again.'} onRetry={() => refetch()} />
          ) : results.length === 0 ? (
            <EmptyState icon="🔍" title="No properties found" description="Try adjusting your filters or search criteria to find more properties." />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
                {results.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-8)' }}>
                  <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </button>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
