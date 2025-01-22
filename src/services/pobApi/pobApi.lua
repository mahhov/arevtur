-- windows
local _, _, scriptPath = string.find(arg[0], '(.+[/\\]).-')
package.path = package.path .. ';' .. scriptPath .. '?.lua' -- HeadlessWrapper
package.path = package.path .. ';' .. './lua/?.lua' -- xml

-- linux
package.path = package.path .. ';../runtime/lua/?.lua' -- dkjson & xml

function respond(response, debug)
    if not debug then
        response = '<.' .. response .. '.>'
    end
    io.write(response .. '\n')
    io.flush()
end

respond('script started', true)

require('HeadlessWrapper')
respond('HeadlessWrapper loaded', true)

local dkjson = require 'dkjson'
respond('dkjson loaded', true)

-- infra

local function readFile(path)
    local fileHandle = io.open(path, 'r')
    if not fileHandle then
        return nil
    end
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
    if text then
        self.text = self.text .. text .. '\n'
    end
end
function FakeTooltip:AddSeparator()
    self.text = self.text .. '\n'
end

function emplaceNewLines(string)
    return string:gsub([[\n]], '\n') -- replace escaped \\n with real \n
end

local sampleItemAmulet = [[
    Item Class: Amulets
    Rarity: Rare
    Empyrean Collar
    Citrine Amulet
]]

function loadExtraMods(mods)
--     local itemText = sampleItemAmulet .. '\n' .. emplaceNewLines(mods)
--     local item = new('Item', itemText)
--     item.type = 'extraSlot'
--
--     local extraSlot = build.itemsTab.slots['extraSlot']
--     local oldItemText = build.itemsTab.items[extraSlot.selItemId]
--     if oldItemText and item.raw == oldItemText.raw then
--         return
--     end
--
--     respond('loading extra mods: ', itemText, true)
--     build.itemsTab:AddItem(item)
--     build.buildFlag = true
--     build:OnFrame({})
end

-- override the legion timeless jewel reads because Inflate is hard to replicate
data.readLUT = function()
    return {}
end

-- core

respond('ready', true)

while true do
    local input = io.read()
    local args = dkjson.decode(input)
    respond('received command ' .. args.cmd, true)

    if args.cmd == 'exit' then
        os.exit()

    elseif args.cmd == 'build' then
        loadBuildFromXML(readFile(args.path))
        build.itemsTab:UpdateSockets()
        -- copied from `ItemsTab addSlot`
        -- todo[medium] support ignoring es, eva, arm, res in eff health
--         local slot = new("ItemSlotControl", nil, 0, 0, build.itemsTab, 'extraSlot')
--         build.itemsTab.slots[slot.slotName] = slot
--         table.insert(build.itemsTab.orderedSlots, slot)
--         build.itemsTab.slotOrder[slot.slotName] = #build.itemsTab.orderedSlots
--         table.insert(build.itemsTab.controls, slot)
--         build.itemsTab.activeItemSet.extraSlot = { selItemId = 0 }
        respond('build loaded')

    elseif args.cmd == 'item' then
        -- given item text, see what swapping it in, replacing the currently equipped item of that
        -- type would do for the build
        loadExtraMods(args.extraMods)
        local item = new('Item', emplaceNewLines(args.text))
        if item.base then
            item:NormaliseQuality()
            item:BuildAndParseRaw()
            local tooltip = FakeTooltip:new()
            build.itemsTab:AddItemTooltip(tooltip, item)
            respond(tooltip.text)
        else
            respond('Item missing base type')
        end

    elseif args.cmd == 'mod' then
        -- given a mod and item type, see what adding that mod to the currently equipped item of
        -- that type would do for the build
        loadExtraMods(args.extraMods)
        local slot = build.itemsTab.slots[args.type]
        if slot then
            local equippedItem = build.itemsTab.items[slot.selItemId] or { raw = sampleItemAmulet }
            local newItem = new('Item', equippedItem.raw .. '\n' .. args.mod)
            local tooltip = FakeTooltip:new()
            build.itemsTab:AddItemTooltip(tooltip, newItem)
            respond(tooltip.text)
        else
            respond('Individual mod weights aren\'t supported on this item type')
        end

    elseif args.cmd == 'getModWeights' then
        -- given an item type and other params, generate a search query for replacing the currently
        -- equipped item of that type
        loadExtraMods(args.extraMods)
        local itemsTab = build.itemsTab
        local tradeQuery = itemsTab.tradeQuery
        tradeQuery:PriceItem()
        local tradeQueryGenerator = tradeQuery.tradeQueryGenerator

        tradeQuery.statSortSelectionList = {
            { stat = 'TotalEHP', weightMult = tonumber(args.weights.effectiveHealth) },
            { stat = 'Life', weightMult = tonumber(args.weights.totalLife) },
            { stat = 'Mana', weightMult = tonumber(args.weights.totalMana) },
            { stat = 'ManaRegen', weightMult = tonumber(args.weights.manaRegen) },
            { stat = 'FullDPS', weightMult = tonumber(args.weights.damage) },
        }

        -- TradeQueryClass:PriceItemRowDisplay
        local jewelNodeId
        for nodeId, slot in pairs(itemsTab.sockets) do
            if not slot.inactive then
                jewelNodeId = nodeId
                break
            end
        end
        local slot = itemsTab.slots[args.type] or itemsTab.sockets[jewelNodeId]
        tradeQueryGenerator:RequestQuery(slot, { slotTbl = {} },
                tradeQuery.statSortSelectionList, function(context, query, errMsg)
                    respond('RequestQuery: ' .. (errMsg == nil and 'no error' or errMsg), true)
                    local minValue = dkjson.decode(query).query.stats[1].value.min
                    respond(dkjson.encode({ minValue, tradeQueryGenerator.modWeights }))
                end)

        -- TradeQueryGeneratorClass:RequestQuery execute
        local eldritchModSlots = {
            ['Body Armour'] = true,
            ['Helmet'] = true,
            ['Gloves'] = true,
            ['Boots'] = true
        }
        local jewelTypes = {
            ['Jewel Any'] = 'Any',
            ['Jewel Base'] = 'Base',
            ['Jewel Abyss'] = 'Abyss',
        }
        local options = {
            includeCorrupted = args.includeCorrupted,
            includeEldritch = eldritchModSlots[slot.slotName] == true and args.options.includeEldritch,
            includeTalisman = slot.slotName == 'Amulet' and args.options.includeTalisman,
            influence1 = 1,
            influence2 = 1,
            maxPrice = 1,
            statWeights = tradeQuery.statSortSelectionList,
            jewelType = jewelTypes[args.type],
        }
        respond('Slot ' .. slot.slotName .. ', Options ' .. dkjson.encode(options), true)
        tradeQueryGenerator:StartQuery(slot, options)

        if args.options.includeInfluence then
            for _, influence in pairs(itemLib.influenceInfo) do
                tradeQueryGenerator.calcContext.testItem[influence.key] = true
            end
        end

        tradeQueryGenerator:OnFrame()
        -- todo[low] replace weakest or empty jewel slot instead of 1st jewel slot
        -- todo[low] make sure these all work for characters with empty slots

    elseif args.cmd == 'getCraftedMods' then
        local response = dkjson.encode(data.masterMods)
        respond('craft mods length: ' .. #response, true)
        respond(response)

    else
        respond('unrecognized command ' .. args.cmd)
    end
end
