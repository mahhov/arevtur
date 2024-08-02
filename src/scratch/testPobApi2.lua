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

-- our loop

--table.insert(build.itemsTab.orderedSlots, { slotName = 'x' })
--io.write('ready ::end::')
--io.flush()

buildXmlFile =
'/home/manukh/.var/app/community.pathofbuilding.PathOfBuilding/data/pobfrontend/Path of Building/Builds/cobra lash.xml'
buildXml = readFile(buildXmlFile)
loadBuildFromXML(buildXml)


--local itemText = [[
--Item Class: Helmets
--Rarity: Rare
--Havoc Dome
--Noble Tricorne
----------
--Evasion Rating: 421 (augmented)
----------
--Requirements:
--Level: 48
--Dex: 99
----------
--Sockets: G
----------
--Item Level: 70
----------
--+10 to maximum Life
--]]
--
--local item = new('Item', itemText)
--item:BuildModList()
--local tooltip = FakeTooltip:new()
--build.itemsTab:AddItemTooltip(tooltip, item)
----io.write(tooltip.text .. '::end::')
----io.flush()
--
--
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
--
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

local arg1 = 'Belt'
local arg2 = '10'
local fakeQueryTab = { pbLeagueRealName = '', itemsTab = build.itemsTab }
local tradeQueryGenerator = new("TradeQueryGenerator", fakeQueryTab)
local slot = build.itemsTab.slots[arg1]
local context = { slotTbl = {} }
local statWeights = {
  { stat = 'FullDPS',            label = 'FullDPS label',            weightMult = .5 },
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
  io.write('done')
  io.write(query)
  io.flush()
end)
tradeQueryGenerator:StartQuery(slot, options)
tradeQueryGenerator:OnFrame(slot, options)
