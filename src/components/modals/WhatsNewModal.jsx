import { Sparkles, Calendar, Zap, Bug, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { useAuth } from '../../context/AuthContext'
import { whatsNewData } from '../../data/mockData'

export default function WhatsNewModal() {
  const { showWhatsNew, dismissWhatsNew, CURRENT_VERSION } = useAuth()

  const handleClose = () => {
    // Explicit dismissal requirement:
    // localStorage.setItem("lastSeenVersion", CURRENT_VERSION) + setShowWhatsNew(false)
    dismissWhatsNew()
  }

  const getFeatureIcon = (type) => {
    switch (type) {
      case 'new':
        return <Sparkles className="w-3.5 h-3.5" />
      case 'improved':
        return <Zap className="w-3.5 h-3.5" />
      case 'fixed':
        return <Bug className="w-3.5 h-3.5" />
      default:
        return <Check className="w-3.5 h-3.5" />
    }
  }

  const getBadgeColors = (type) => {
    switch (type) {
      case 'new':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800'
      case 'improved':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800'
      case 'fixed':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
    }
  }

  return (
    <Dialog open={Boolean(showWhatsNew)} onOpenChange={(val) => { if (!val) handleClose() }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-white text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 shadow-2xl rounded-xl">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                    What's New in OneHealth
                  </DialogTitle>
                  <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800 font-mono text-xs">
                    {CURRENT_VERSION || whatsNewData.version}
                  </Badge>
                </div>
                <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  Released: {whatsNewData.releaseDate}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Current Version Changelog */}
        <div className="space-y-4 py-2">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Latest Updates ({CURRENT_VERSION || whatsNewData.version})
            </h4>
            <div className="space-y-2">
              {whatsNewData.features.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700"
                >
                  <Badge
                    variant="default"
                    className={`text-[10px] px-2 py-0.5 mt-0.5 shrink-0 flex items-center gap-1 uppercase ${getBadgeColors(item.type)}`}
                  >
                    {getFeatureIcon(item.type)}
                    {item.type}
                  </Badge>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-snug">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Version Badges */}
          <div className="pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
              Previous Releases
            </h4>
            <div className="space-y-2">
              {whatsNewData.previousVersions.map((prev, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs dark:bg-slate-800/50 dark:border-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-xs text-slate-700 bg-slate-200 px-2 py-0.5 rounded dark:text-slate-300 dark:bg-slate-700">
                      {prev.version}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">{prev.summary}</span>
                  </div>
                    <span className="text-slate-400 dark:text-slate-500 text-sm shrink-0">{prev.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 dark:border-slate-800 pt-3">
          <Button
            onClick={handleClose}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
