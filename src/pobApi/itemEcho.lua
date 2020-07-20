local _, _, scriptPath = string.find(arg[0], '(.+[/\\]).-')
package.path = package.path .. ';' .. scriptPath .. '?.lua'
package.path = package.path .. ';' .. [[./lua/?.lua]]
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

io.write('ready ::end::')
io.flush()

while true do
    local input = io.read()
    local _, _, cmd = input:find('<(%w+)>')
    local _, _, value = input:find('<%w+> (.*)')
    if cmd == 'exit' then
        os.exit()
    elseif cmd == 'build' then
        loadBuildFromXML(readFile(value))
    elseif cmd == 'item' then
        local itemText = value:gsub([[\n]], "\n")
        local item = new('Item', build.targetVersion, itemText)
        item:BuildModList()
        local tooltip = FakeTooltip:new()
        build.itemsTab:AddItemTooltip(tooltip, item)
        io.write(tooltip.text .. '::end::')
        io.flush()
    elseif cmd == 'mod' then
       local itemText = [[
           Rarity: normal
           Vine Circlet
       ]] .. value
       local item = new('Item', build.targetVersion, itemText)
       item:BuildModList()
       local calcFunc, calcBase =  build.calcsTab:GetNodeCalculator()
       local output = calcFunc({{modList = item.modList}})
       local tooltip = FakeTooltip:new()
       build:AddStatComparesToTooltip(tooltip, calcBase, output, "")
       io.write(tooltip.text .. '::end::')
       io.flush()
    end
end
