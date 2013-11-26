import random

zipRandom = {}

f = open('stateZip.csv')
for line in f:
	values = line.split(',')
	if zipRandom.has_key(values[0]):
		zipRandom[values[0]].append(values[1])
	else:
		zipList = []
		zipList.append(values[1])
		zipRandom[values[0]]=zipList
		
def getZip(state) :
	if zipRandom.has_key(state):
		return zipRandom[state][random.randint(0,len(zipRandom[state])-1)]
