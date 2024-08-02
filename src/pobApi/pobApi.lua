package.path = package.path .. ';../runtime/lua/?.lua'
package.path = package.path .. ';../?.lua'
require('HeadlessWrapper')

-- infra

local function readFile(path)
    local fileHandle = io.open(path, 'r')
    if not fileHandle then return nil end
    local fileText = fileHandle:read('*a')
    fileHandle:close()
    return fileText
end

FakeTooltip = {
    text = ''
}

function FakeTooltip:new()
    o = {}
    setmetatable(o, self)
    self.__index = self
    return o
end

function FakeTooltip:AddLine(_, text)
    self.text = self.text .. text .. '\n'
end

function FakeTooltip:AddSeparator()
    self.text = self.text .. '\n'
end

function getArgs(input)
    args = {}
    for arg in input:gmatch('<(.-)>') do
        table.insert(args, arg)
    end
    return args
end

function respond(response, debug)
    if not debug then
        response = '<.' .. response .. '.>'
    end
    io.write(response .. '\n')
    io.flush()
end

-- core

table.insert(build.itemsTab.orderedSlots, { slotName = 'x' })
respond('ready')

while true do
    local input = io.read()
    local args = getArgs(input)
    local cmd = args[1]
    if cmd == 'exit' then
        os.exit()
    elseif cmd == 'build' then
        -- args[2] is build xml path
        loadBuildFromXML(readFile(args[2]))
    elseif cmd == 'item' then
        -- args[2] is item text
        local itemText = args[2]:gsub([[\n]], "\n")
        local item = new('Item', itemText)
        item:BuildModList()
        local tooltip = FakeTooltip:new()
        build.itemsTab:AddItemTooltip(tooltip, item)
        respond(tooltip.text)
    elseif cmd == 'mod-old' then
        -- args[2] is mod, e.g. '+100 evasion'
        itemText = [[
            Item Class: Helmets
            Rarity: Rare
            Havoc Dome
            Noble Tricorne
        ]] .. args[2]
        table.insert(build.itemsTab.orderedSlots, { slotName = 'x' })
        local item = new('Item', itemText)
        local calcFunc = build.calcsTab:GetMiscCalculator()
        local outputBase = calcFunc({}, {})
        local outputNew = calcFunc({ repSlotName = 'x', repItem = item }, {})
        local tooltip = FakeTooltip:new()
        build:AddStatComparesToTooltip(tooltip, outputBase, outputNew, "")
        respond(tooltip.text)
    elseif cmd == 'mod' then
        -- args[2] is type, e.g. 'Amulet'
        -- args[3] is mod, e.g. '+100 evasion'
        local slots = build.itemsTab.slots
        local slot = slots[args[3]]
        local equippedItem = build.itemsTab.items[slot.selItemId]
        local newItem = new('Item', equippedItem.raw .. '\n' .. args[2])
        local tooltip = FakeTooltip:new()
        build.itemsTab:AddItemTooltip(tooltip, newItem)
        respond(tooltip.text)
    elseif cmd == 'generateQuery' then
        -- args[2] is type, e.g. 'Amulet'
        -- args[3] is max price, e.g. '10'
        -- args[4] is life weight, e.g. '1'
        -- args[5] is DPS weight, e.g. '1'
        local fakeQueryTab = { pbLeagueRealName = '', itemsTab = build.itemsTab }
        local tradeQueryGenerator = new("TradeQueryGenerator", fakeQueryTab)
        local slot = build.itemsTab.slots[args[2]]
        local context = { slotTbl = {} }
        local statWeights = {
            { stat = 'Effective Hit Pool', label = '', weightMult = args[4] },
            { stat = 'FullDPS',            label = '', weightMult = args[5] },
            --{ stat = '"FireResist"',             label = '', weightMult = 0 },
            --{ stat = '"FireResistOverCap"',      label = '', weightMult = 0 },
            --{ stat = '"ColdResist"',             label = '', weightMult = 0 },
            --{ stat = '"ColdResistOverCap"',      label = '', weightMult = 0 },
            --{ stat = '"LightningResist"',        label = '', weightMult = 0 },
            --{ stat = '"LightningResistOverCap"', label = '', weightMult = 0 },
            --{ stat = '"ChaosResist"',            label = '', weightMult = 0 },
            --{ stat = '"ChaosResistOverCap"',     label = '', weightMult = 0 },
        }
        local options = {
            includeCorrupted = true,
            includeSynthesis = false,
            includeEldritch = false,
            includeScourge = false,
            includeTalisman = true,
            influence1 = 1,
            influence2 = 1,
            maxPrice = tonumber(args[3]),
            maxPriceType = nil,
            statWeights = statWeights,
        }
        tradeQueryGenerator:RequestQuery(slot, context, statWeights, function(context, query, errMsg)
            if errMsg then
                io.write(errMsg)
            end
            respond(query)
        end)
        tradeQueryGenerator:StartQuery(slot, options)
        tradeQueryGenerator:OnFrame(slot, options)
    end
end
