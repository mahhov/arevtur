-- windows
local _, _, scriptPath = string.find(arg[0], '(.+[/\\]).-')
package.path = package.path .. ';' .. scriptPath .. '?.lua' -- HeadlessWrapper
package.path = package.path .. ';' .. './lua/?.lua' -- xml

-- linux
package.path = package.path .. ';../runtime/lua/?.lua' -- dkjsno & xml

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

function getArgs(input)
    -- parses a string, e.g. '<x> <3> <4>', into array of strings
    args = {}
    for arg in input:gmatch('<(.-)>') do
        table.insert(args, arg)
    end
    return args
end

function toJson(o)
    if type(o) == 'table' then
        local s = ' { '
        for k, v in pairs(o) do
            s = s .. '"' .. k .. '" : ' .. toJson(v) .. ', '
        end
        return s .. ' } '
    else
        if type(o) == 'number' then
            return tostring(o)
        else
            return '"' .. tostring(o) .. '"'
        end
    end
end

local defaultItem = {
    raw = [[
                        Item Class: Amulets
                        Rarity: Rare
                        Empyrean Collar
                        Citrine Amulet
                    ]]
}

-- override the legion timeless jewel reads because Inflate is hard to replicate
data.readLUT = function()
    return {}
end

-- core

respond('ready', true)

while true do
    local input = io.read()
    local args = getArgs(input)
    local cmd = args[1]
    respond('received command ' .. cmd, true)

    if cmd == 'echo' then
        respond('echo')

    elseif cmd == 'exit' then
        os.exit()

    elseif cmd == 'build' then
        -- args[2] is build xml path
        loadBuildFromXML(readFile(args[2]))
        respond('build loaded')

    elseif cmd == 'item' then
        -- args[2] is item text
        -- given item text, see what swapping it in, replacing the currently equipped item of that
        -- type would do for the build
        local itemText = args[2]:gsub([[\n]], '\n') -- replace escaped \\n with real \n
        local item = new('Item', itemText)
        if item.base then
            local tooltip = FakeTooltip:new()
            build.itemsTab:AddItemTooltip(tooltip, item)
            respond(tooltip.text)
        else
            respond('Item missing base type')
        end

    elseif cmd == 'mod' then
        -- args[2] is type, e.g. 'Amulet'
        -- args[3] is mod, e.g. '+100 evasion'
        -- given a mod and item type, see what adding that mod to the currently equipped item of
        -- that type would do for the build
        local slots = build.itemsTab.slots
        local slot = slots[args[3]]
        if slot then
            local equippedItem = build.itemsTab.items[slot.selItemId] or defaultItem
            local newItem = new('Item', equippedItem.raw .. '\n' .. args[2])
            local tooltip = FakeTooltip:new()
            build.itemsTab:AddItemTooltip(tooltip, newItem)
            respond(tooltip.text)
        else
            respond('Individual mod weights aren\'t supported on this item type')
        end

    elseif cmd == 'getModWeights' then
        -- args[2] is type, e.g. 'Amulet'
        -- args[3] is total EPH weight, e.g. '1'
        -- args[4] is total resist weight, e.g. '1'
        -- args[5] is full DPS weight, e.g. '1'
        -- args[6] is Str weight, e.g. '1'
        -- args[7] is Dex weight, e.g. '1'
        -- args[8] is Int weight, e.g. '1'
        -- args[9] is includeCorrupted
        -- given an item type and other params, generate a search query for replacing the currently
        -- equipped item of that type

        local itemsTab = build.itemsTab
        local tradeQuery = itemsTab.tradeQuery
        tradeQuery:PriceItem()
        local tradeQueryGenerator = tradeQuery.tradeQueryGenerator

        tradeQuery.statSortSelectionList = {
            { stat = 'TotalEHP', weightMult = tonumber(args[3]) },
            { stat = 'ChaosResistTotal', weightMult = tonumber(args[4]) },
            { stat = 'LightningResistTotal', weightMult = tonumber(args[4]) },
            { stat = 'ColdResistTotal', weightMult = tonumber(args[4]) },
            { stat = 'FireResistTotal', weightMult = tonumber(args[4]) },
            { stat = 'FullDPS', weightMult = tonumber(args[5]) },
            { stat = 'Str', weightMult = tonumber(args[6]) },
            { stat = 'Dex', weightMult = tonumber(args[7]) },
            { stat = 'Int', weightMult = tonumber(args[8]) },
        }

        -- TradeQueryClass:PriceItemRowDisplay
        local jewelNodeId
        for nodeId, slot in pairs(itemsTab.sockets) do
            if not slot.inactive then
                jewelNodeId = nodeId
                break
            end
        end
        local slot = itemsTab.slots[args[2]] or itemsTab.sockets[jewelNodeId]
        tradeQueryGenerator:RequestQuery(slot, { slotTbl = {} },
                tradeQuery.statSortSelectionList, function(context, query, errMsg)
                    respond('RequestQuery: ' .. (errMsg == nil and 'no error' or errMsg), true)
                    respond(dkjson.encode(tradeQueryGenerator.modWeights))
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
            ['jewel Base'] = 'Base',
            ['jewel Abyss'] = 'Abyss',
        }
        local options = {
            includeCorrupted = args[6],
            includeEldritch = eldritchModSlots[slot.slotName] == true,
            includeTalisman = slot.slotName == 'Amulet',
            influence1 = 1,
            influence2 = 1,
            maxPrice = 1,
            statWeights = tradeQuery.statSortSelectionList,
            jewelType = jewelTypes[args[2]],
        }
        respond('Options ' .. toJson(options), true)
        tradeQueryGenerator:StartQuery(slot, options)
        tradeQueryGenerator:OnFrame()
        -- todo[low] replace weakest or empty jewel slot instead of 1st jewel slot
        -- todo[medium] allow picking mod sets, e.g. talisman, corrupted, influence, eldritch
        -- todo[low] json params
        -- todo[low] make sure these all work for characters with empty slots

    elseif cmd == 'getCraftedMods' then
        local response = toJson(data.masterMods)
        respond('craft mods length: ' .. #response, true)
        respond(response)
    end
end
