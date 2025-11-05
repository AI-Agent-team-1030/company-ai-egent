'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, PlusIcon, AtSymbolIcon } from '@heroicons/react/24/outline'

interface Agent {
  id: string
  name: string
  description: string
  connections: string[]
  tasks: string[]
  status: 'active' | 'idle'
}

export default function OrganizationPage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [showConnectMenu, setShowConnectMenu] = useState(false)
  const [connectSearch, setConnectSearch] = useState('')
  const [showAddAgentForm, setShowAddAgentForm] = useState(false)
  const [newAgentForm, setNewAgentForm] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'idle',
  })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showConnectMenu && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showConnectMenu])
  
  const initialAgents: Record<string, Agent> = {
    ceo: {
      id: 'ceo',
      name: '経営AI',
      description: '戦略的意思決定と全体統括',
      connections: ['sales', 'marketing', 'hr', 'finance', 'dev', 'admin'],
      tasks: ['経営方針策定', '予算配分', 'KPI管理'],
      status: 'active',
    },
    sales: {
      id: 'sales',
      name: '営業AI',
      description: '新規顧客獲得と売上管理',
      connections: ['marketing', 'ceo'],
      tasks: ['リード発掘', '商談管理', '売上予測'],
      status: 'active',
    },
    marketing: {
      id: 'marketing',
      name: 'マーケティングAI',
      description: '広告施策とブランディング',
      connections: ['sales', 'ceo'],
      tasks: ['キャンペーン企画', 'SNS運用', '効果測定'],
      status: 'active',
    },
    hr: {
      id: 'hr',
      name: '人事AI',
      description: '採用と人材育成',
      connections: ['ceo'],
      tasks: ['採用計画', '評価管理', '研修企画'],
      status: 'active',
    },
    finance: {
      id: 'finance',
      name: '財務AI',
      description: '予算管理と財務分析',
      connections: ['ceo'],
      tasks: ['予算策定', '経費分析', 'レポート作成'],
      status: 'active',
    },
    dev: {
      id: 'dev',
      name: '開発AI',
      description: 'システム開発と保守',
      connections: ['ceo'],
      tasks: ['機能開発', 'バグ修正', '技術選定'],
      status: 'idle',
    },
    admin: {
      id: 'admin',
      name: '総務AI',
      description: 'バックオフィス業務',
      connections: ['ceo'],
      tasks: ['契約管理', '備品管理', '施設管理'],
      status: 'idle',
    },
  }

  const [agents, setAgents] = useState<Record<string, Agent>>(initialAgents)
  const [departmentAgents, setDepartmentAgents] = useState(['sales', 'marketing', 'hr', 'finance', 'dev', 'admin'])
  const selectedAgentData = selectedAgent ? agents[selectedAgent] : null

  const availableToConnect = selectedAgent
    ? Object.keys(agents).filter(
        (id) =>
          id !== selectedAgent &&
          !agents[selectedAgent].connections.includes(id) &&
          (!connectSearch || agents[id].name.toLowerCase().includes(connectSearch.toLowerCase()))
      )
    : []

  const handleAddConnection = (targetId: string) => {
    if (!selectedAgent) return
    
    setAgents(prev => {
      const updated = { ...prev }
      if (!updated[selectedAgent].connections.includes(targetId)) {
        updated[selectedAgent].connections.push(targetId)
      }
      if (!updated[targetId].connections.includes(selectedAgent)) {
        updated[targetId].connections.push(selectedAgent)
      }
      return updated
    })
    
    setShowConnectMenu(false)
    setConnectSearch('')
  }

  const handleAddAgent = () => {
    if (!newAgentForm.name.trim()) return

    const newId = `agent-${Date.now()}`
    const newAgent: Agent = {
      id: newId,
      name: newAgentForm.name,
      description: newAgentForm.description,
      connections: [],
      tasks: [],
      status: newAgentForm.status,
    }

    setAgents(prev => ({ ...prev, [newId]: newAgent }))
    setDepartmentAgents(prev => [...prev, newId])
    
    setNewAgentForm({ name: '', description: '', status: 'active' })
    setShowAddAgentForm(false)
  }

  const isConnected = (agentId: string) => {
    if (!selectedAgent) return false
    return selectedAgent === agentId || 
           agents[selectedAgent].connections.includes(agentId) ||
           agents[agentId].connections.includes(selectedAgent)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">組織図</h1>
            <p className="text-gray-600">AIエージェントをクリックして連携を確認・追加</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddAgentForm(true)}
            className="px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            新規エージェント追加
          </motion.button>
        </div>
      </motion.div>

      {/* Add Agent Modal */}
      <AnimatePresence>
        {showAddAgentForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">新規AIエージェント</h2>
                <button
                  onClick={() => {
                    setShowAddAgentForm(false)
                    setNewAgentForm({ name: '', description: '', status: 'active' })
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    エージェント名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAgentForm.name}
                    onChange={(e) => setNewAgentForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例：カスタマーサポートAI"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    説明
                  </label>
                  <textarea
                    value={newAgentForm.description}
                    onChange={(e) => setNewAgentForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="このAIエージェントの役割を入力..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    ステータス
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setNewAgentForm(prev => ({ ...prev, status: 'active' }))}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        newAgentForm.status === 'active'
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      稼働中
                    </button>
                    <button
                      onClick={() => setNewAgentForm(prev => ({ ...prev, status: 'idle' }))}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        newAgentForm.status === 'idle'
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      待機中
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddAgentForm(false)
                    setNewAgentForm({ name: '', description: '', status: 'active' })
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-bold"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAddAgent}
                  disabled={!newAgentForm.name.trim()}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  追加
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex gap-8">
        {/* Hierarchical Structure */}
        <div className="flex-1">
          <div className="max-w-6xl mx-auto">
            {/* CEO AI - Top Center */}
            <div className="flex justify-center mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                onClick={() => setSelectedAgent(selectedAgent === 'ceo' ? null : 'ceo')}
                className={`cursor-pointer w-96 bg-white rounded-2xl p-6 shadow-lg border-2 transition-all ${
                  selectedAgent === 'ceo'
                    ? 'border-black shadow-2xl'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-2xl font-bold text-gray-900">{agents.ceo.name}</h3>
                  <div className={`w-3 h-3 rounded-full ${
                    agents.ceo.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                </div>
                <p className="text-sm text-gray-600 mb-4">{agents.ceo.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>連携: {agents.ceo.connections.length}件</span>
                  <span>•</span>
                  <span>タスク: {agents.ceo.tasks.length}件</span>
                </div>
              </motion.div>
            </div>

            {/* Vertical Connection Line */}
            <div className="flex justify-center mb-12">
              <div className="w-0.5 h-16 bg-gray-300" />
            </div>

            {/* Department AIs - Bottom Grid with Connection Lines */}
            <div className="relative">
              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                {departmentAgents.map((agentId, index) => {
                  const isHighlighted = isConnected(agentId) || selectedAgent === 'ceo'
                  const col = index % 3
                  const row = Math.floor(index / 3)
                  
                  return (
                    <line
                      key={agentId}
                      x1="50%"
                      y1="0"
                      x2={`${(col * 33.33) + 16.67}%`}
                      y2={`${row * 50 + 15}%`}
                      stroke={isHighlighted ? '#000' : '#d1d5db'}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeDasharray="5,5"
                    />
                  )
                })}
              </svg>

              {/* Department Cards */}
              <div className="grid grid-cols-3 gap-6 relative" style={{ zIndex: 10 }}>
                {departmentAgents.map((agentId, index) => {
                  const agent = agents[agentId]
                  const isSelected = selectedAgent === agentId
                  const isHighlighted = isConnected(agentId)
                  
                  return (
                    <motion.div
                      key={agentId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      onClick={() => setSelectedAgent(isSelected ? null : agentId)}
                      className={`cursor-pointer bg-white rounded-xl p-4 shadow-md border-2 transition-all ${
                        isSelected
                          ? 'border-black shadow-2xl'
                          : isHighlighted
                          ? 'border-gray-400 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">{agent.name}</h4>
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{agent.description}</p>
                      <div className="text-xs text-gray-500">
                        連携: {agent.connections.length}件
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Agent Detail Panel */}
        <AnimatePresence>
          {selectedAgentData && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-96 bg-white border-2 border-gray-900 rounded-2xl p-6 shadow-xl"
              style={{ height: 'fit-content', position: 'sticky', top: '2rem' }}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {selectedAgentData.name}
                  </h2>
                  <p className="text-sm text-gray-600">{selectedAgentData.description}</p>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Status */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedAgentData.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <span className="text-sm font-bold text-gray-900">
                    {selectedAgentData.status === 'active' ? '稼働中' : '待機中'}
                  </span>
                </div>
              </div>

              {/* Tasks */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase">担当タスク</h3>
                <div className="space-y-2">
                  {selectedAgentData.tasks.map((task, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connections */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase">
                  連携先 ({selectedAgentData.connections.length})
                </h3>
                <div className="space-y-2">
                  {selectedAgentData.connections.map((connId) => {
                    const connAgent = agents[connId]
                    return (
                      <motion.button
                        key={connId}
                        whileHover={{ x: 4 }}
                        onClick={() => setSelectedAgent(connId)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            connAgent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <div>
                            <p className="font-bold text-sm text-gray-900">{connAgent.name}</p>
                            <p className="text-xs text-gray-600">{connAgent.description}</p>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Add Connection */}
              <div>
                {!showConnectMenu ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowConnectMenu(true)}
                    className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <PlusIcon className="w-5 h-5" />
                    連携先を追加
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="relative">
                      <AtSymbolIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        ref={inputRef}
                        type="text"
                        value={connectSearch}
                        onChange={(e) => setConnectSearch(e.target.value)}
                        placeholder="@AIエージェントを検索..."
                        className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-lg focus:outline-none text-sm"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {availableToConnect.length > 0 ? (
                        availableToConnect.map((agentId) => {
                          const agent = agents[agentId]
                          return (
                            <motion.button
                              key={agentId}
                              whileHover={{ x: 4 }}
                              onClick={() => handleAddConnection(agentId)}
                              className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                            >
                              <div className={`w-2 h-2 rounded-full ${
                                agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                              }`} />
                              <div className="flex-1">
                                <p className="font-bold text-sm text-gray-900">{agent.name}</p>
                                <p className="text-xs text-gray-600">{agent.description}</p>
                              </div>
                            </motion.button>
                          )
                        })
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          {connectSearch ? '該当するAIが見つかりません' : 'すべてのAIと連携済みです'}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setShowConnectMenu(false)
                        setConnectSearch('')
                      }}
                      className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      キャンセル
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
