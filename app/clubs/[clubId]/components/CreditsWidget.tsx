'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Coins, TrendingUp, TrendingDown, Plus, Info } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'

interface CreditTransaction {
  id: string
  amount: number
  transaction_type: string
  description: string
  created_at: string
}

interface CreditsWidgetProps {
  clubId: string
  currentCredits: number
  compact?: boolean
}

export function CreditsWidget({ clubId, currentCredits, compact = false }: CreditsWidgetProps) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (showHistory) {
      loadTransactions()
    }
  }, [showHistory])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/book-clubs/${clubId}/credits/transactions`)
      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 rounded-lg">
        <Coins className="h-5 w-5 text-yellow-600" />
        <div>
          <div className="text-sm font-medium text-gray-700">Credits</div>
          <div className="text-xl font-bold text-yellow-600">{currentCredits}</div>
        </div>
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Info className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Credit History</DialogTitle>
              <DialogDescription>Your recent credit transactions</DialogDescription>
            </DialogHeader>
            <TransactionHistory transactions={transactions} loading={loading} />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Credit Balance</CardTitle>
            <CardDescription>Earn credits by giving critiques</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-yellow-600 flex items-center gap-2">
              <Coins className="h-8 w-8" />
              {currentCredits}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-sm text-blue-900">How to Earn Credits</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li className="flex items-center gap-2">
              <Plus className="h-3 w-3" />
              <span>Give a critique: +1 credit</span>
            </li>
            <li className="flex items-center gap-2">
              <Plus className="h-3 w-3" />
              <span>Helpful critique (marked by author): +2 credits</span>
            </li>
            <li className="flex items-center gap-2">
              <Plus className="h-3 w-3" />
              <span>New member bonus: +10 credits</span>
            </li>
          </ul>
        </div>

        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              View Transaction History
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Credit History</DialogTitle>
              <DialogDescription>Your recent credit transactions</DialogDescription>
            </DialogHeader>
            <TransactionHistory transactions={transactions} loading={loading} />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

function TransactionHistory({
  transactions,
  loading,
}: {
  transactions: CreditTransaction[]
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No transactions yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {transactions.map(transaction => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            {transaction.amount > 0 ? (
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            ) : (
              <div className="p-2 bg-red-100 rounded-full">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
            )}
            <div>
              <div className="font-medium">{transaction.description}</div>
              <div className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>
          <Badge variant={transaction.amount > 0 ? 'default' : 'secondary'}>
            {transaction.amount > 0 ? '+' : ''}
            {transaction.amount}
          </Badge>
        </div>
      ))}
    </div>
  )
}
