import { memo } from 'react'
import {
  SiPostgresql,
  SiMysql,
  SiMongodb,
  SiRedis,
  SiApachekafka,
  SiRabbitmq,
  SiSqlite,
  SiGo,
  SiPython,
  SiRuby,
  SiNodedotjs,
  SiTypescript,
  SiJavascript,
  SiRust,
  SiDotnet,
  SiGraphql,
  SiReact,
  SiKubernetes,
  SiElasticsearch,
  SiApollographql,
  SiDocker,
  SiAmazonwebservices,
  SiGooglecloud,
  SiFirebase,
  SiNginx,
} from 'react-icons/si'
import { FaDatabase, FaServer, FaCube } from 'react-icons/fa'

interface TechIconProps {
  technology?: string[]
  className?: string
}

type IconComponent = typeof SiPostgresql

interface IconConfig {
  icon: IconComponent | typeof FaDatabase
  color: string
}

// Map technology keywords to icons
function getIconConfig(technology?: string[]): IconConfig {
  if (!technology || !Array.isArray(technology) || technology.length === 0) {
    return { icon: FaCube, color: 'text-slate-400' }
  }

  const techStr = technology.join(' ').toLowerCase()

  // Databases
  if (techStr.includes('postgres') || techStr.includes('postgis')) return { icon: SiPostgresql, color: 'text-blue-400' }
  if (techStr.includes('mysql')) return { icon: SiMysql, color: 'text-orange-400' }
  if (techStr.includes('mongo')) return { icon: SiMongodb, color: 'text-green-500' }
  if (techStr.includes('redis') || techStr.includes('dragonfly')) return { icon: SiRedis, color: 'text-red-500' }
  if (techStr.includes('elasticsearch') || techStr.includes('opensearch')) return { icon: SiElasticsearch, color: 'text-yellow-400' }
  if (techStr.includes('kafka')) return { icon: SiApachekafka, color: 'text-slate-300' }
  if (techStr.includes('rabbitmq') || techStr.includes('amqp')) return { icon: SiRabbitmq, color: 'text-orange-500' }
  if (techStr.includes('sqlite')) return { icon: SiSqlite, color: 'text-blue-300' }
  if (techStr.includes('redshift') || techStr.includes('bigquery')) return { icon: FaDatabase, color: 'text-purple-400' }

  // Languages/Runtimes
  if (techStr.match(/\bgo\b/) || techStr.includes('go 1.') || techStr.includes('golang')) return { icon: SiGo, color: 'text-cyan-400' }
  if (techStr.includes('python')) return { icon: SiPython, color: 'text-yellow-400' }
  if (techStr.includes('ruby') || techStr.includes('rails')) return { icon: SiRuby, color: 'text-red-600' }
  if (techStr.includes('typescript')) return { icon: SiTypescript, color: 'text-blue-500' }
  if (techStr.includes('node') || techStr.includes('n8n')) return { icon: SiNodedotjs, color: 'text-green-500' }
  if (techStr.includes('javascript')) return { icon: SiJavascript, color: 'text-yellow-400' }
  if (techStr.includes('rust')) return { icon: SiRust, color: 'text-orange-600' }
  if (techStr.includes('c#') || techStr.includes('dotnet') || techStr.includes('.net')) return { icon: SiDotnet, color: 'text-purple-500' }

  // Frameworks/APIs
  if (techStr.includes('graphql') || techStr.includes('gqlgen')) return { icon: SiGraphql, color: 'text-pink-500' }
  if (techStr.includes('apollo') || techStr.includes('cosmo')) return { icon: SiApollographql, color: 'text-purple-400' }
  if (techStr.includes('react')) return { icon: SiReact, color: 'text-cyan-400' }
  if (techStr.includes('kubernetes') || techStr.includes('k8s')) return { icon: SiKubernetes, color: 'text-blue-500' }
  if (techStr.includes('docker')) return { icon: SiDocker, color: 'text-blue-400' }
  if (techStr.includes('nginx')) return { icon: SiNginx, color: 'text-green-500' }
  if (techStr.includes('centrifugo')) return { icon: FaServer, color: 'text-red-400' }

  // Cloud
  if (techStr.includes('aws') || techStr.includes('amazon')) return { icon: SiAmazonwebservices, color: 'text-orange-400' }
  if (techStr.includes('gcp') || techStr.includes('google cloud')) return { icon: SiGooglecloud, color: 'text-blue-400' }
  if (techStr.includes('firebase') || techStr.includes('genkit')) return { icon: SiFirebase, color: 'text-yellow-500' }

  // Default
  return { icon: FaServer, color: 'text-slate-400' }
}

export const TechIcon = memo(({ technology, className = 'w-4 h-4' }: TechIconProps) => {
  const { icon: Icon, color } = getIconConfig(technology)

  return (
    <div className={`${className} ${color} flex items-center justify-center`}>
      <Icon className="w-full h-full" />
    </div>
  )
})

TechIcon.displayName = 'TechIcon'
