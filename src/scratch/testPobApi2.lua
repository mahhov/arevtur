local _, _, scriptPath = string.find(arg[0], '(.+[/\\]).-')
--package.path = package.path .. ';/home/manukh/personal/arevtur/src/pobApi/HeadlessWrapper.lua'
package.path = package.path .. ';../runtime/lua/?.lua' -- dkjsno
package.path = package.path .. ';../?.lua'
require('HeadlessWrapper')
print('Headless wrapper loaded')

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
    self.text = self.text .. text .. '\n'
end
function FakeTooltip:AddSeparator()
    self.text = self.text .. '\n'
end

--NewFileSearch(string) -> FileSearch
--FileSearch
--    GetFileModifiedTime() -> nil
--    GetFileName() -> string
--    NextFile() -> boolean
function GetScriptPath()
    return "."
end
FileSearch = {
    files = {},
}
function FileSearch:new()
    o = {}
    setmetatable(o, self)
    self.__index = self
    return o
end
function NewFileSearch(path)
    isLinux = os.getenv('HOME')
    cmd = isLinux and 'ls' or 'dir /B'
    cmdHideErr = isLinux and '2>/dev/null' or '2>nul'
    fullCmd = cmd .. ' ' .. path .. ' ' .. cmdHideErr
    print(fullCmd)
    fs = FileSearch:new()
    lsOutput = io.popen(fullCmd)
    for filename in lsOutput:lines() do
        print(filename)
        table.insert(fs.files, filename)
    end
    lsOutput:close()
    return #fs.files > 0 and fs or nil
end
function FileSearch:GetFileModifiedTime()
    return nil
end
function FileSearch:GetFileName()
    return self.files[1]:match('([^/]+)$')
end
function FileSearch:NextFile()
    table.remove(self.files, 1)
    return self.files[1]
end


function toJson(o)
    if type(o) == 'table' then
        local s = ' { '
        for k, v in pairs(o) do
            s = s .. '"' .. k .. '" : ' .. toJson(v) .. ', '
        end
        return s .. ' } '
    else
        return tostring(o)
    end
end

function dump(o)
    if type(o) == 'table' then
        local s = '{ '
        for k, v in pairs(o) do
            if type(k) ~= 'number' then
                k = '"' .. k .. '"'
            end
            s = s .. '[' .. k .. '] = ' .. dump(v) .. ','
        end
        return s .. '} '
    else
        return tostring(o)
    end
end

function printKeys(o)
    for k, v in pairs(o) do
        print(k)
    end
end

-- our loop

--table.insert(build.itemsTab.orderedSlots, { slotName = 'x' })
--io.write('ready ::end::')
--io.flush()

function Inflate(data)
    print('Inflate called<<<<<<<<<<<<<<<<<<<<<<,')
    return nil
end

--buildXmlFile = '~/.var/app/community.pathofbuilding.PathOfBuilding/data/pobfrontend/Path of Building/Builds/cobra lash.xml'
buildXmlFile = '/home/manukh/.var/app/community.pathofbuilding.PathOfBuilding/data/pobfrontend/Path of Building/Builds/cobra lash.xml'
buildXml = readFile(buildXmlFile)

data.readLUT = function()
    return {}
end

loadBuildFromXML(buildXml)
print('BUILD LOADED')

--print(buildXml)
--print(build.calcsTab.colWidth)
--print(build.calcsTab:GetMiscCalculator() ~= nil)

--os.exit()

--
---- ITEM SWAP - given item text, see what swapping it in would do for the build
--
----local itemText = [[
----Item Class: Rings
----Rarity: Unique
----Mark of Submission
----Unset Ring
------------
----Requirements:
----Level: 24
------------
----Sockets: R
------------
----Item Level: 71
------------
----Has 1 Socket (implicit)
------------
----Curse Enemies with Socketed Hex Curse Gem on Hit
------------
----So great was the thaumaturgy of a bloodpriest's mark,
----that sacrifices soon welcomed their death.
----]]
----local item = new('Item', itemText)
----if item.base then
----    print(' , ' .. item.baseName .. ' , ' .. item.name)
----    --item:BuildModList()
----    local tooltip = FakeTooltip:new()
----    build.itemsTab:AddItemTooltip(tooltip, item)
----    print(tooltip.text)
----else
----    print('item has no base')
----end
--
--
---- MOD ON SLOT X - given a mod, see what adding that mod new fake item, i.e. not replacing a currently equipped item,  would do for the build
--
----local value = '+100 to maximum Life'
----local type = 'Amulet'
----itemText = [[
----Item Class: Helmets
----Rarity: Rare
----Havoc Dome
----Noble Tricorne
----+100 to maximum Life
----+100 to maximum Life
----+100 to maximum Life
----+100 to maximum Life
----]] .. value
----table.insert(build.itemsTab.orderedSlots, { slotName = 'x' })
----local item = new('Item', itemText)
----local calcFunc = build.calcsTab:GetMiscCalculator()
----local outputBase = calcFunc({}, {})
----local outputNew = calcFunc({ repSlotName = 'x', repItem = item }, {})
----local tooltip = FakeTooltip:new()
----build:AddStatComparesToTooltip(tooltip, outputBase, outputNew, '')
------io.write(tooltip.text .. '::end::')
------io.flush()
----
--
--
--
--
---- MOD ON AMULET - given a mod and item type, see what adding that mod to the currently equipped item of that type would do for the build
--
----local arg1 = '+100 intelligence'
----local arg2 = 'Amulet'
----local slots = build.itemsTab.slots
----local slot = slots[arg2]
----local equippedItem = build.itemsTab.items[slot.selItemId]
----io.write('>' .. arg2 ..', ' .. slot.selItemId .. '\n')
----local newItem = new('Item', equippedItem.raw .. '\n' .. arg1)
----local tooltip = FakeTooltip:new()
----build.itemsTab:AddItemTooltip(tooltip, newItem)
----io.write(tooltip.text .. '::end::')
----io.flush()

---- TRADE - given an item type and other params, generate a search query for replacing the currently equipped item of that type

local arg2 = 'Jewel Any' -- item type
local arg2 = 'Weapon 1'  -- item type
local arg3 = '10'        -- max price
local arg4 = '1'         -- total EPH weight
local arg5 = '1'         -- total resist weight
local arg6 = '.5'        -- full DPS weight

local itemsTab = build.itemsTab
local tradeQuery = itemsTab.tradeQuery
tradeQuery:PriceItem()
local tradeQueryGenerator = tradeQuery.tradeQueryGenerator

--print(dump(tradeQuery.slotTables))

tradeQuery.statSortSelectionList = {
    { stat = 'TotalEHP', weightMult = tonumber(arg4) },
    { stat = 'ChaosResistTotal', weightMult = tonumber(arg5) },
    { stat = 'LightningResistTotal', weightMult = tonumber(arg5) },
    { stat = 'ColdResistTotal', weightMult = tonumber(arg5) },
    { stat = 'FireResistTotal', weightMult = tonumber(arg5) },
    { stat = 'FullDPS', weightMult = tonumber(arg6) },
}

---- TradeQueryClass:PriceItemRowDisplay
local jewelNodeId
for nodeId, slot in pairs(itemsTab.sockets) do
    if not slot.inactive then
        jewelNodeId = nodeId
        break
    end
end

local slot = itemsTab.slots[arg2] or itemsTab.sockets[jewelNodeId]

tradeQueryGenerator:RequestQuery(slot, { slotTbl = {} },
        tradeQuery.statSortSelectionList, function(context, query, errMsg)
            --print('RequestQuery: ' .. (errMsg == nil and 'no error' or errMsg))
            print('\n\n query: ' .. query)

            local url = tradeQuery.tradeQueryRequests:buildUrl(tradeQuery.hostName .. 'trade/search', tradeQuery.pbRealm, 'Settlers')
            url = url .. '?q=' .. urlEncode(query)

            print('\n\n url: ' .. url)

            --print('debug')
            --print(tradeQueryGenerator.calcContext.options.includeCorrupted)
            --print(dump(tradeQueryGenerator.alreadyWeightedMods))
            --print('')
            --print(dump(tradeQueryGenerator.modWeights))
            --print('')
            --print(dkjson.encode(tradeQueryGenerator.modWeights))
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
    includeCorrupted = true, -- this is being ignored
    includeEldritch = eldritchModSlots[slot.slotName] == true,
    includeTalisman = slot.slotName == 'Amulet',
    influence1 = 1,
    influence2 = 1,
    maxPrice = tonumber(arg3),
    statWeights = tradeQuery.statSortSelectionList,
    jewelType = jewelTypes[arg2],
}
--print(dump(options))
tradeQueryGenerator:StartQuery(slot, options)

print(toJson(tradeQueryGenerator.calcContext.baseOutput))

tradeQueryGenerator:OnFrame()

--print('')
--print('')
--print('')
--print('mods')
--print(dump(tradeQueryGenerator.modData.Explicit['1269_TwoHandLightningDamageWeaponPrefixAndFlat']))
--print(dump(tradeQueryGenerator.modData.Explicit))



-- LOADING TimelessJewelData



--
--fileHandle = NewFileSearch(GetScriptPath() .. '/Data/TimelessJewelData/' .. 'GloriousVanity' .. ".zip.part*")
----print('num files: ' .. #fileHandle.files)
--
--scriptPath = GetScriptPath()
--splitFile = {}
--while fileHandle do
--    local fileName = fileHandle:GetFileName()
--    --    print('Opening ' .. fileName)
--    local file = io.open(scriptPath .. "/Data/TimelessJewelData/" .. fileName, "rb")
--    local part = tonumber(fileName:match("%.part(%d)")) or 0
--    --    print('PART ' .. part)
--    splitFile[part + 1] = file:read("*a")
--    file:close()
--    if not fileHandle:NextFile() then
--        break
--    end
--end
--
--splitFile = table.concat(splitFile, "")
--
--isLinux = os.getenv('HOME')
--fullCmd = 'echo ' .. splitFile .. ' | unzip /dev/stdin'
----fullCmd = 'echo ' .. splitFile[1] .. ' | head 100000'
--unzipOutput = io.popen(fullCmd)
--for x in unzipOutput:lines() do
--    print(x)
--end
--unzipOutput:close()



