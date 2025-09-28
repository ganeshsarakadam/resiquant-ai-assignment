'use client'

import { useState } from "react"

const FieldList = () => {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="px-4 py-2 border-b bg-white">
                <h2 className="text-sm font-medium">Field List</h2>
            </div>
            <div className="flex-1 min-h-0 overflow-auto p-4 space-y-2">
                {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="rounded-lg border px-3 py-2 text-sm">
                        Field {i + 1}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default FieldList