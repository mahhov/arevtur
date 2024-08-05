local _, _, scriptPath = string.find(arg[0], '(.+[/\\]).-')
package.path = package.path .. ';../runtime/lua/?.lua'
package.path = package.path .. ';../?.lua'
require('HeadlessWrapper')


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

function dump(o)
  if type(o) == 'table' then
    local s = '{ '
    for k, v in pairs(o) do
      if type(k) ~= 'number' then k = '"' .. k .. '"' end
      s = s .. '[' .. k .. '] = ' .. dump(v) .. ','
    end
    return s .. '} '
  else
    return tostring(o)
  end
end

-- our loop

--table.insert(build.itemsTab.orderedSlots, { slotName = 'x' })
--io.write('ready ::end::')
--io.flush()

buildXmlFile =
'/home/manukh/.var/app/community.pathofbuilding.PathOfBuilding/data/pobfrontend/Path of Building/Builds/cobra lash.xml'
buildXml = readFile(buildXmlFile)
loadBuildFromXML(buildXml)




-- ITEM SWAP - given item text, see what swapping it in would do for the build

--local itemText = [[
--Item Class: Belts
--Rarity: Rare
--Demon Clasp
--Vanguard Belt
----------
--Requirements:
--Level: 78
----------
--Item Level: 86
----------
--+320 to Armour and Evasion Rating (implicit)
----------
--+37 to Strength
--+520 to Armour
--+113 to maximum Life
--30% increased Stun Duration on Enemies
--22% increased Stun and Block Recovery
--Flasks applied to you have 11% increased Effect
--]]
--local item = new('Item', itemText)
--item:BuildModList()
--local tooltip = FakeTooltip:new()
--build.itemsTab:AddItemTooltip(tooltip, item)
--io.write(tooltip.text .. '::end::')
--io.flush()




-- MOD ON SLOT X - given a mod, see what adding that mod new fake item, i.e. not replacing a currently equipped item,  would do for the build

--local value = "+100 to maximum Life"
--local type = 'Amulet'
--itemText = [[
--Item Class: Helmets
--Rarity: Rare
--Havoc Dome
--Noble Tricorne
--+100 to maximum Life
--+100 to maximum Life
--+100 to maximum Life
--+100 to maximum Life
--]] .. value
--table.insert(build.itemsTab.orderedSlots, { slotName = 'x' })
--local item = new('Item', itemText)
--local calcFunc = build.calcsTab:GetMiscCalculator()
--local outputBase = calcFunc({}, {})
--local outputNew = calcFunc({ repSlotName = 'x', repItem = item }, {})
--local tooltip = FakeTooltip:new()
--build:AddStatComparesToTooltip(tooltip, outputBase, outputNew, "")
----io.write(tooltip.text .. '::end::')
----io.flush()
--




-- MOD ON AMULET - given a mod and item type, see what adding that mod to the currently equipped item of that type would do for the build

--local arg1 = '+100 intelligence'
--local arg2 = 'Amulet'
--local slots = build.itemsTab.slots
--local slot = slots[arg2]
--local equippedItem = build.itemsTab.items[slot.selItemId]
--io.write('>' .. arg2 ..', ' .. slot.selItemId .. '\n')
--local newItem = new('Item', equippedItem.raw .. '\n' .. arg1)
--local tooltip = FakeTooltip:new()
--build.itemsTab:AddItemTooltip(tooltip, newItem)
--io.write(tooltip.text .. '::end::')
--io.flush()



-- TRADE - given an item type and other params, generate a search query for replacing the currently equipped item of that type

local arg2 = 'Jewel 49684' -- item type
local arg3 = '10'          -- max price
local arg4 = '1'           -- total EPH weight
local arg5 = '1'           -- total resist weight
local arg6 = '.5'          -- full DPS weight

local itemsTab = build.itemsTab
local tradeQuery = itemsTab.tradeQuery
tradeQuery:PriceItem()
local tradeQueryGenerator = tradeQuery.tradeQueryGenerator

print(dump(tradeQuery.slotTables))

tradeQuery.statSortSelectionList = {
  { stat = 'TotalEHP',             weightMult = tonumber(arg4) },
  { stat = 'ChaosResistTotal',     weightMult = tonumber(arg5) },
  { stat = 'LightningResistTotal', weightMult = tonumber(arg5) },
  { stat = 'ColdResistTotal',      weightMult = tonumber(arg5) },
  { stat = 'FireResistTotal',      weightMult = tonumber(arg5) },
  { stat = 'FullDPS',              weightMult = tonumber(arg6) },
}

-- TradeQueryClass:PriceItemRowDisplay
local slot = itemsTab.slots[arg2]

for k, v in pairs(itemsTab.slots) do
  print(k)
end

local row_idx = 10
local slotTbl = tradeQuery.slotTables[row_idx]
local slot = slotTbl.nodeId and itemsTab.sockets[slotTbl.nodeId] or
    slotTbl.slotName and
    (itemsTab.slots[slotTbl.slotName] or slotTbl.fullName and itemsTab.slots[slotTbl.fullName]) -- fullName for Abyssal Sockets

tradeQueryGenerator:RequestQuery(slot, { slotTbl = {} },
  tradeQuery.statSortSelectionList, function(context, query, errMsg)
    print('RequestQuery: ' .. (errMsg == nil and 'no error' or errMsg))
    print(query)
    --print('debug')
    --print(tradeQueryGenerator.calcContext.options.includeCorrupted)
    --print(dump(tradeQueryGenerator.alreadyWeightedMods))
    --print('')
    --print(dump(tradeQueryGenerator.modWeights))
  end)

-- TradeQueryGeneratorClass:RequestQuery execute
local eldritchModSlots = {
  ["Body Armour"] = true,
  ["Helmet"] = true,
  ["Gloves"] = true,
  ["Boots"] = true
}
local options = {
  includeCorrupted = true, -- this is being ignored
  includeEldritch = eldritchModSlots[slot.slotName] == true,
  includeTalisman = slot.slotName == 'Amulet',
  influence1 = 1,
  influence2 = 1,
  maxPrice = tonumber(arg3),
  statWeights = tradeQuery.statSortSelectionList,
}
print(dump(options))
tradeQueryGenerator:StartQuery(slot, options)
tradeQueryGenerator:OnFrame()
