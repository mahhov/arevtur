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

-- core

table.insert(build.itemsTab.orderedSlots, { slotName = 'x' })
io.write('ready ::end::')
io.flush()

while true do
    local input = io.read()
    local _, _, cmd = input:find('<(.*)> <.*> <.*>')
    local _, _, arg1 = input:find('<.*> <(.*)> <.*>')
    local _, _, arg2 = input:find('<.*> <.*> <(.*)>')
    if cmd == 'exit' then
        os.exit()
    elseif cmd == 'build' then
        loadBuildFromXML(readFile(arg1))
    elseif cmd == 'item' then
        local itemText = arg1:gsub([[\n]], "\n")
        local item = new('Item', itemText)
        item:BuildModList()
        local tooltip = FakeTooltip:new()
        build.itemsTab:AddItemTooltip(tooltip, item)
        io.write(tooltip.text .. '::end::')
        io.flush()
    elseif cmd == 'modold' then
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
        io.write(tooltip.text .. '::end::')
        io.flush()
    elseif cmd == 'mod' then
        local slots = build.itemsTab.slots
        local slot = slots[arg2]
        local equippedItem = build.itemsTab.items[slot.selItemId]
        local newItem = new('Item', equippedItem.raw .. '\n' .. arg1)
        local tooltip = FakeTooltip:new()
        build.itemsTab:AddItemTooltip(tooltip, newItem)
        io.write(tooltip.text .. '::end::')
        io.flush()
    end
end
