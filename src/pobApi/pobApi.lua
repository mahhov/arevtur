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

function respond(response)
    io.write('<-<' .. response .. '>->')
    io.flush()
end

-- core

table.insert(build.itemsTab.orderedSlots, { slotName = 'x' })
respond('ready')

while true do
    local input = io.read()
    local _, _, cmd = input:find('<(.*)> <.*> <.*>')
    local _, _, arg1 = input:find('<.*> <(.*)> <.*>')
    local _, _, arg2 = input:find('<.*> <.*> <(.*)>')
    if cmd == 'exit' then
        -- arg1 is empty
        -- arg2 is empty
        os.exit()
    elseif cmd == 'build' then
        -- arg1 is build xml path
        -- arg2 is empty
        loadBuildFromXML(readFile(arg1))
    elseif cmd == 'item' then
        -- arg1 is item text
        -- arg2 is empty
        local itemText = arg1:gsub([[\n]], "\n")
        local item = new('Item', itemText)
        item:BuildModList()
        local tooltip = FakeTooltip:new()
        build.itemsTab:AddItemTooltip(tooltip, item)
        respond(tooltip.text)
    elseif cmd == 'modold' then
        -- arg1 is mod, e.g. '+100 evasion'
        -- arg2 is empty
        itemText = [[
            Item Class: Helmets
            Rarity: Rare
            Havoc Dome
            Noble Tricorne
        ]] .. arg1
        table.insert(build.itemsTab.orderedSlots, { slotName = 'x' })
        local item = new('Item', itemText)
        local calcFunc = build.calcsTab:GetMiscCalculator()
        local outputBase = calcFunc({}, {})
        local outputNew = calcFunc({ repSlotName = 'x', repItem = item }, {})
        local tooltip = FakeTooltip:new()
        build:AddStatComparesToTooltip(tooltip, outputBase, outputNew, "")
        respond(tooltip.text)
    elseif cmd == 'mod' then
        -- arg1 is type, e.g. 'Amulet'
        -- arg2 is mod, e.g. '+100 evasion'
        local slots = build.itemsTab.slots
        local slot = slots[arg2]
        local equippedItem = build.itemsTab.items[slot.selItemId]
        local newItem = new('Item', equippedItem.raw .. '\n' .. arg1)
        local tooltip = FakeTooltip:new()
        build.itemsTab:AddItemTooltip(tooltip, newItem)
        respond(tooltip.text)
    elseif cmd == 'generateQuery' then
        -- arg1 is type, e.g. 'Amulet'
        -- arg2 is max price, e.g. '10'
        local fakeQueryTab = { pbLeagueRealName = '', itemsTab = build.itemsTab }
        local tradeQueryGenerator = new("TradeQueryGenerator", fakeQueryTab)
        local slot = build.itemsTab.slots[arg1]
        local context = { slotTbl = {} }
        local statWeights = {
            { stat = 'FullDPS',            label = 'FullDPS label',            weightMult = 1 },
            { stat = 'Effective Hit Pool', label = 'Effective Hit Pool label', weightMult = 1 },
        }
        local options = {
            includeCorrupted = true,
            includeSynthesis = false,
            includeEldritch = false,
            includeScourge = false,
            includeTalisman = true,
            influence1 = 1,
            influence2 = 1,
            maxPrice = tonumber(arg2),
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
