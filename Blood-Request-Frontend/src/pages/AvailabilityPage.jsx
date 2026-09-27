import { Droplets } from 'lucide-react'
import { useLanguage } from '../context/useLanguage'
import AvailabilityChecker from '../components/AvailabilityChecker'

import PageHeader from '../components/PageHeader'

export default function AvailabilityPage() {
  const { t } = useLanguage()

  return (
    <div>
      <PageHeader
        icon={Droplets}
        title={t('section.availability')}
        description={t('section.availabilityDesc')}
      />
      <AvailabilityChecker />
    </div>
  )
}
