import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TechIcon } from '../TechIcon'

describe('TechIcon', () => {
  it('should render default icon for undefined technology', () => {
    const { container } = render(<TechIcon />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should render default icon for empty array', () => {
    const { container } = render(<TechIcon technology={[]} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should render PostgreSQL icon', () => {
    const { container } = render(<TechIcon technology={['PostgreSQL']} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(container.querySelector('.text-blue-400')).toBeInTheDocument()
  })

  it('should render MySQL icon', () => {
    const { container } = render(<TechIcon technology={['MySQL']} />)
    expect(container.querySelector('.text-orange-400')).toBeInTheDocument()
  })

  it('should render MongoDB icon', () => {
    const { container } = render(<TechIcon technology={['MongoDB']} />)
    expect(container.querySelector('.text-green-500')).toBeInTheDocument()
  })

  it('should render Redis icon', () => {
    const { container } = render(<TechIcon technology={['Redis']} />)
    expect(container.querySelector('.text-red-500')).toBeInTheDocument()
  })

  it('should render Dragonfly as Redis icon', () => {
    const { container } = render(<TechIcon technology={['Dragonfly']} />)
    expect(container.querySelector('.text-red-500')).toBeInTheDocument()
  })

  it('should render Elasticsearch icon', () => {
    const { container } = render(<TechIcon technology={['Elasticsearch']} />)
    expect(container.querySelector('.text-yellow-400')).toBeInTheDocument()
  })

  it('should render OpenSearch as Elasticsearch icon', () => {
    const { container } = render(<TechIcon technology={['OpenSearch']} />)
    expect(container.querySelector('.text-yellow-400')).toBeInTheDocument()
  })

  it('should render Kafka icon', () => {
    const { container } = render(<TechIcon technology={['Kafka']} />)
    expect(container.querySelector('.text-slate-300')).toBeInTheDocument()
  })

  it('should render RabbitMQ icon', () => {
    const { container } = render(<TechIcon technology={['RabbitMQ']} />)
    expect(container.querySelector('.text-orange-500')).toBeInTheDocument()
  })

  it('should render AMQP as RabbitMQ icon', () => {
    const { container } = render(<TechIcon technology={['AMQP']} />)
    expect(container.querySelector('.text-orange-500')).toBeInTheDocument()
  })

  it('should render SQLite icon', () => {
    const { container } = render(<TechIcon technology={['SQLite']} />)
    expect(container.querySelector('.text-blue-300')).toBeInTheDocument()
  })

  it('should render Go icon', () => {
    const { container } = render(<TechIcon technology={['Go 1.21']} />)
    expect(container.querySelector('.text-cyan-400')).toBeInTheDocument()
  })

  it('should render Golang icon', () => {
    const { container } = render(<TechIcon technology={['Golang']} />)
    expect(container.querySelector('.text-cyan-400')).toBeInTheDocument()
  })

  it('should render Python icon', () => {
    const { container } = render(<TechIcon technology={['Python']} />)
    expect(container.querySelector('.text-yellow-400')).toBeInTheDocument()
  })

  it('should render Ruby icon', () => {
    const { container } = render(<TechIcon technology={['Ruby']} />)
    expect(container.querySelector('.text-red-600')).toBeInTheDocument()
  })

  it('should render Rails as Ruby icon', () => {
    const { container } = render(<TechIcon technology={['Rails']} />)
    expect(container.querySelector('.text-red-600')).toBeInTheDocument()
  })

  it('should render TypeScript icon', () => {
    const { container } = render(<TechIcon technology={['TypeScript']} />)
    expect(container.querySelector('.text-blue-500')).toBeInTheDocument()
  })

  it('should render Node.js icon', () => {
    const { container } = render(<TechIcon technology={['Node.js']} />)
    expect(container.querySelector('.text-green-500')).toBeInTheDocument()
  })

  it('should render n8n as Node icon', () => {
    const { container } = render(<TechIcon technology={['n8n']} />)
    expect(container.querySelector('.text-green-500')).toBeInTheDocument()
  })

  it('should render JavaScript icon', () => {
    const { container } = render(<TechIcon technology={['JavaScript']} />)
    expect(container.querySelector('.text-yellow-400')).toBeInTheDocument()
  })

  it('should render Rust icon', () => {
    const { container } = render(<TechIcon technology={['Rust']} />)
    expect(container.querySelector('.text-orange-600')).toBeInTheDocument()
  })

  it('should render .NET icon', () => {
    const { container } = render(<TechIcon technology={['.NET']} />)
    expect(container.querySelector('.text-purple-500')).toBeInTheDocument()
  })

  it('should render C# as .NET icon', () => {
    const { container } = render(<TechIcon technology={['C#']} />)
    expect(container.querySelector('.text-purple-500')).toBeInTheDocument()
  })

  it('should render GraphQL icon', () => {
    const { container } = render(<TechIcon technology={['GraphQL']} />)
    expect(container.querySelector('.text-pink-500')).toBeInTheDocument()
  })

  it('should render gqlgen as GraphQL icon', () => {
    const { container } = render(<TechIcon technology={['gqlgen']} />)
    expect(container.querySelector('.text-pink-500')).toBeInTheDocument()
  })

  it('should render Apollo icon', () => {
    const { container } = render(<TechIcon technology={['Apollo']} />)
    expect(container.querySelector('.text-purple-400')).toBeInTheDocument()
  })

  it('should render Cosmo as Apollo icon', () => {
    const { container } = render(<TechIcon technology={['Cosmo']} />)
    expect(container.querySelector('.text-purple-400')).toBeInTheDocument()
  })

  it('should render React icon', () => {
    const { container } = render(<TechIcon technology={['React']} />)
    expect(container.querySelector('.text-cyan-400')).toBeInTheDocument()
  })

  it('should render Kubernetes icon', () => {
    const { container } = render(<TechIcon technology={['Kubernetes']} />)
    expect(container.querySelector('.text-blue-500')).toBeInTheDocument()
  })

  it('should render k8s as Kubernetes icon', () => {
    const { container } = render(<TechIcon technology={['k8s']} />)
    expect(container.querySelector('.text-blue-500')).toBeInTheDocument()
  })

  it('should render Docker icon', () => {
    const { container } = render(<TechIcon technology={['Docker']} />)
    expect(container.querySelector('.text-blue-400')).toBeInTheDocument()
  })

  it('should render Nginx icon', () => {
    const { container } = render(<TechIcon technology={['Nginx']} />)
    expect(container.querySelector('.text-green-500')).toBeInTheDocument()
  })

  it('should render AWS icon', () => {
    const { container } = render(<TechIcon technology={['AWS']} />)
    expect(container.querySelector('.text-orange-400')).toBeInTheDocument()
  })

  it('should render Amazon as AWS icon', () => {
    const { container } = render(<TechIcon technology={['Amazon']} />)
    expect(container.querySelector('.text-orange-400')).toBeInTheDocument()
  })

  it('should render GCP icon', () => {
    const { container } = render(<TechIcon technology={['GCP']} />)
    expect(container.querySelector('.text-blue-400')).toBeInTheDocument()
  })

  it('should render Google Cloud as GCP icon', () => {
    const { container } = render(<TechIcon technology={['Google Cloud']} />)
    expect(container.querySelector('.text-blue-400')).toBeInTheDocument()
  })

  it('should render Firebase icon', () => {
    const { container } = render(<TechIcon technology={['Firebase']} />)
    expect(container.querySelector('.text-yellow-500')).toBeInTheDocument()
  })

  it('should render Genkit as Firebase icon', () => {
    const { container } = render(<TechIcon technology={['Genkit']} />)
    expect(container.querySelector('.text-yellow-500')).toBeInTheDocument()
  })

  it('should render Centrifugo icon', () => {
    const { container } = render(<TechIcon technology={['Centrifugo']} />)
    expect(container.querySelector('.text-red-400')).toBeInTheDocument()
  })

  it('should render Redshift as database icon', () => {
    const { container } = render(<TechIcon technology={['Redshift']} />)
    expect(container.querySelector('.text-purple-400')).toBeInTheDocument()
  })

  it('should render BigQuery as database icon', () => {
    const { container } = render(<TechIcon technology={['BigQuery']} />)
    expect(container.querySelector('.text-purple-400')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<TechIcon technology={['Python']} className="w-8 h-8" />)
    expect(container.firstChild).toHaveClass('w-8')
    expect(container.firstChild).toHaveClass('h-8')
  })

  it('should use default className when not provided', () => {
    const { container } = render(<TechIcon technology={['Python']} />)
    expect(container.firstChild).toHaveClass('w-4')
    expect(container.firstChild).toHaveClass('h-4')
  })

  it('should handle multiple technologies and use first match', () => {
    const { container } = render(<TechIcon technology={['Unknown', 'PostgreSQL']} />)
    expect(container.querySelector('.text-blue-400')).toBeInTheDocument()
  })

  it('should render PostGIS as PostgreSQL icon', () => {
    const { container } = render(<TechIcon technology={['PostGIS']} />)
    expect(container.querySelector('.text-blue-400')).toBeInTheDocument()
  })
})
