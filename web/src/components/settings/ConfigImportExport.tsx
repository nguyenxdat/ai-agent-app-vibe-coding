/**
 * Configuration Import/Export Component
 * UI for backing up and restoring agent configurations
 */

import { useState, useRef } from 'react'
import { Download, Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import type { AgentConfiguration } from '@shared/types/agent'
import {
  downloadConfiguration,
  readConfigurationFile,
  validateConfiguration,
  mergeConfigurations,
} from '@shared/utils/configExport'

interface ConfigImportExportProps {
  agents: AgentConfiguration[]
  onImport: (agents: AgentConfiguration[]) => Promise<void>
}

export function ConfigImportExport({ agents, onImport }: ConfigImportExportProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | 'warning' | null
    message: string
    details?: string[]
  }>({ type: null, message: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    try {
      downloadConfiguration(agents)
      setImportStatus({
        type: 'success',
        message: `Successfully exported ${agents.length} agent configuration(s)`,
      })

      // Clear success message after 3 seconds
      setTimeout(() => {
        setImportStatus({ type: null, message: '' })
      }, 3000)
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: 'Failed to export configurations',
        details: [error instanceof Error ? error.message : String(error)],
      })
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportStatus({ type: null, message: '' })

    try {
      // Read and parse file
      const imported = await readConfigurationFile(file)

      // Validate
      const validation = validateConfiguration(imported)

      if (!validation.valid) {
        setImportStatus({
          type: 'error',
          message: 'Configuration validation failed',
          details: validation.errors,
        })
        return
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        setImportStatus({
          type: 'warning',
          message: 'Configuration imported with warnings',
          details: validation.warnings,
        })
      }

      // Merge with existing configurations
      const merged = mergeConfigurations(agents, imported, 'merge')

      // Call onImport callback
      await onImport(merged)

      if (!validation.warnings.length) {
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${imported.length} agent configuration(s)`,
        })
      }
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: 'Failed to import configurations',
        details: [error instanceof Error ? error.message : String(error)],
      })
    } finally {
      setIsImporting(false)
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup & Restore</CardTitle>
        <CardDescription>
          Export your agent configurations for backup or import previously saved configurations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Messages */}
        {importStatus.type && (
          <Alert variant={importStatus.type === 'error' ? 'destructive' : 'default'}>
            {importStatus.type === 'success' && <CheckCircle className="h-4 w-4" />}
            {importStatus.type === 'error' && <AlertCircle className="h-4 w-4" />}
            {importStatus.type === 'warning' && <AlertCircle className="h-4 w-4" />}
            <AlertDescription>
              <div className="font-medium">{importStatus.message}</div>
              {importStatus.details && importStatus.details.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                  {importStatus.details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Export Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Export Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Download all agent configurations as a JSON file. Note: Authentication tokens will be
            redacted for security.
          </p>
          <Button onClick={handleExport} disabled={agents.length === 0} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Export Configuration ({agents.length} agents)
          </Button>
        </div>

        {/* Import Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Import Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Upload a previously exported configuration file. Existing agents with the same ID will
            be updated.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={handleImportClick}
            variant="outline"
            disabled={isImporting}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isImporting ? 'Importing...' : 'Import Configuration'}
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>
            <strong>Note:</strong> Authentication tokens are not included in exports for security
            reasons.
          </p>
          <p>After importing, you'll need to re-enter tokens for any agents that require them.</p>
        </div>
      </CardContent>
    </Card>
  )
}
