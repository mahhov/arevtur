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

local function getKeys(t)
    local keys = {}
    for key, _ in pairs(t) do
        table.insert(keys, key)
    end
    return keys
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

buildXmlFile = '/home/x/.var/app/community.pathofbuilding.PathOfBuilding/data/pobfrontend/Path of Building/Builds/cobra lash.xml'
buildXml = readFile(buildXmlFile)

loadBuildFromXML(buildXml)
print('BUILD LOADED')



-- core

respond('ready', true)

args = {
    nil,
    'Jewel Any',
    1, 1, 1,
    1, 1, 1,
    false,
}

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

itemsTab:UpdateSockets()

local baseSlots = { "Weapon 1", "Weapon 2", "Helmet", "Body Armour", "Gloves", "Boots", "Amulet", "Ring 1", "Ring 2", "Belt", "Flask 1", "Flask 2", "Flask 3", "Flask 4", "Flask 5" }

local activeAbyssalSockets = {
    ["Weapon 1"] = { }, ["Weapon 2"] = { }, ["Helmet"] = { }, ["Body Armour"] = { }, ["Gloves"] = { }, ["Boots"] = { }, ["Belt"] = { },
}

-- Individual slot rows
local slotTables = {}
for _, slotName in ipairs(baseSlots) do
    table.insert(slotTables, { slotName = slotName })
    -- add abyssal sockets to slotTables if exist for this slot
    if activeAbyssalSockets[slotName] then
        for _, abyssalSocket in pairs(activeAbyssalSockets[slotName]) do
            table.insert(slotTables, { slotName = abyssalSocket.label, fullName = abyssalSocket.slotName }) -- actual slotName doesn't fit/excessive in slotName on popup but is needed for exact matching later
        end
    end
end
local activeSocketList = { }
for nodeId, slot in pairs(tradeQuery.itemsTab.sockets) do
    if not slot.inactive then
        table.insert(activeSocketList, nodeId)
    end
end
table.sort(activeSocketList)
for _, nodeId in ipairs(activeSocketList) do
    table.insert(slotTables, { slotName = tradeQuery.itemsTab.sockets[nodeId].label, nodeId = nodeId })
end

for _, x in pairs(slotTables) do
    print(x.slotName, x.nodeId)
end

-- TradeQueryClass:PriceItemRowDisplay
local jewelNodeId
for nodeId, slot in pairs(itemsTab.sockets) do
    if not slot.inactive then
        jewelNodeId = nodeId
        --break

        print(jewelNodeId)
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
            ['Jewel Base'] = 'Base',
            ['Jewel Abyss'] = 'Abyss',
        }
        local options = {
            includeCorrupted = args[6],
            includeEldritch = eldritchModSlots[slot.slotName] == true,
            includeTalisman = slot.slotName == 'Amulet',
            influence1 = 1,
            influence2 = 1,
            maxPrice = 1,
            statWeights = tradeQuery.statSortSelectionList,
            jewelType = 'Base',
        }
        respond('slot ' .. slot.slotName, true)
        respond('Options ' .. toJson(options), true)
        tradeQueryGenerator:StartQuery(slot, options)
        tradeQueryGenerator:OnFrame()


        --print(toJson(data.masterMods))
    end
end
