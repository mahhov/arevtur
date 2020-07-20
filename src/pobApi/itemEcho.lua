local _, _, scriptPath = string.find(arg[0], '(.+[/\\]).-')
package.path = package.path .. ';' .. scriptPath .. '?.lua'
-- todo make this parameterizable
package.path = package.path .. ';' .. [[C:\Users\manukh\Downloads\PathOfBuilding-1.4.170\lua\?.lua]]
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
    self.text = self.text .. '::sep::' .. '\n'
end

-- our loop

io.write('ready')
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
        local newItem = new('Item', build.targetVersion, itemText)
        newItem:BuildModList()
        local tooltip = FakeTooltip:new()
        build.itemsTab:AddItemTooltip(tooltip, newItem)
        io.write(tooltip.text .. '::end::')
        io.flush()
    end
end
