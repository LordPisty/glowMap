import string,time
from os import curdir, sep
from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
import httplib
from subprocess import Popen, PIPE, STDOUT
import os
import socket
import time
from threading import Thread, Condition, Lock
import datetime
import carrierDict
import carrierColorDict
import zipDict
import zipRandomizer
import dbModule
import operator

preprelast = ''
prelast = '' 

cpreprelast = ''
cprelast = '' 

lastChunkFile = ''
lock = Lock()
baseWebFolder = '/var/www/norvaxGlow/data/'

quotesCounter=0
quotesCounterLock = Lock()

dailyCounter=dbModule.getDailyCounter()
weeklyCounter=dbModule.getWeeklyCounter()
monthlyCounter=dbModule.getMonthlyCounter()

stop = 1

def pad(data) :
	if len(str(data)) == 1:
		return '0'+str(data)
	else :
		return str(data)
			
class dataProvider(Thread):
	def __init__(self):
		Thread.__init__(self)

	def createJson(self,hour,minute):
		global baseWebFolder
		global quotesCounter
		global quotesCounterLock
		global dailyCounter
		global weeklyCounter
		global monthlyCounter
		
		quotesCounterLock.acquire()
		iterationCounter = quotesCounter
		it_dailyCounter = dailyCounter
		it_weeklyCounter = weeklyCounter
		it_monthlyCounter = monthlyCounter
		quotesCounterLock.release()

		now = datetime.datetime.now()
		current = datetime.datetime(now.year,now.month,now.day,now.hour,now.minute)
		next = current + datetime.timedelta(minutes=5)
		results = dbModule.getLogs(str(current.year)+'-'+pad(current.month)+'-'+pad(current.day)+' '+pad(current.hour)+':'+pad(current.minute)+':00',str(next.year)+'-'+pad(next.month)+'-'+pad(next.day)+' '+pad(next.hour)+':'+pad(next.minute)+':00')

		firstline = 0
		counter = 0
		jtext=''
		for result in results:
			counter = counter+1
			if counter == 1:
				jtext += '['
			else:
				jtext += ',['
			if(result['zip'] is None):
				randomZipCode = zipRandomizer.getZip(result['state']).replace('\n','').replace('\r','')
			else:
				randomZipCode = int(result['zip'])
			if(zipDict.zip.has_key(str(randomZipCode))):
				coords= str(zipDict.zip[str(randomZipCode)]).split('|')
			else:
				coords= str(zipDict.zip[str(zipRandomizer.getZip(result['state']).replace('\n','').replace('\r',''))]).split('|')
			jtext += '"'+coords[1]+'",'
			jtext += '"'+coords[0]+'",'
			jtext += '1,'
			if(carrierColorDict.carrierColor.has_key(result['carrier_id'])):
				jtext += '"'+carrierColorDict.carrierColor[result['carrier_id']]+'"]'
			else:
				jtext += '"'+'rgba(169, 203, 237, '+'"]'
			
		quotesCounterLock.acquire()
		quotesCounter = quotesCounter + counter
		dailyCounter = dailyCounter + counter
		weeklyCounter = weeklyCounter + counter
		monthlyCounter = monthlyCounter + counter
		quotesCounterLock.release()

		jtext += ']],'	
		currentJson = pad(current.year)+''+pad(current.month)+''+pad(current.day)+''+pad(current.hour)+''+pad(current.minute)+'.json'
		nextJson = pad(next.year)+''+pad(next.month)+''+pad(next.day)+''+pad(next.hour)+''+pad(next.minute)+'.json'
		jtext += '"next":"'+nextJson+'"}'

		header = '{"interval":300,"data":[['
		header += (str(now.year)+','+str(now.month)+','+str(now.day)+','+str(hour)+','+str(minute))
		header += '],'
		header += str(counter)
		header += ',['
		

		jf = open(baseWebFolder+currentJson, 'w')
		jf.write(header+jtext)	
		print 'created file: '+baseWebFolder+currentJson

		secjtext = '{"interval":300,"data":['
		
		secjtext += '[['+str(now.year)+','+str(now.month)+','+str(now.day)+','+str(hour)+','+str(int(minute)-5)+'],'+str(iterationCounter)+'],'
		quotesCounterLock.acquire()
		secjtext += '[['+str(now.year)+','+str(now.month)+','+str(now.day)+','+str(hour)+','+str(minute)+'],'+str(quotesCounter)+'],'
		secjtext += '[['+str(now.year)+','+str(now.month)+','+str(now.day)+','+str(hour)+','+str(int(minute)-5)+'],'+str(it_dailyCounter)+'],'
		secjtext += '[['+str(now.year)+','+str(now.month)+','+str(now.day)+','+str(hour)+','+str(minute)+'],'+str(dailyCounter)+'],'
		secjtext += '[['+str(now.year)+','+str(now.month)+','+str(now.day)+','+str(hour)+','+str(int(minute)-5)+'],'+str(it_weeklyCounter)+'],'
		secjtext += '[['+str(now.year)+','+str(now.month)+','+str(now.day)+','+str(hour)+','+str(minute)+'],'+str(weeklyCounter)+'],'
		secjtext += '[['+str(now.year)+','+str(now.month)+','+str(now.day)+','+str(hour)+','+str(int(minute)-5)+'],'+str(it_monthlyCounter)+'],'
		secjtext += '[['+str(now.year)+','+str(now.month)+','+str(now.day)+','+str(hour)+','+str(minute)+'],'+str(monthlyCounter)+']'
		quotesCounterLock.release()

		secjtext += '],"next":"count'+nextJson+'"}'

		sjf = open(baseWebFolder+'count'+currentJson, 'w')
		sjf.write(secjtext)	
		print 'created file: '+baseWebFolder+'count'+currentJson
		
		sjf.close()
		jf.close()
		return currentJson

	def run(self):
		global lastChunkFile
		global lock
		global prelast
		global preprelast
		global cprelast
		global cpreprelast
		global stop
		global dailyCounter
		global weeklyCounter
		global monthlyCounter
		
		while stop:
			now = datetime.datetime.now()
			if(operator.mod(int(now.minute),5)==0 and now.second == 30):
				print str(now.day)+'  '+str(now.weekday())+'  '+str(now.hour)+'  '+str(now.minute)
				if(now.day == 1 and now.hour == 0 and now.minute == 0):
					print "reset month"
					monthlyCounter = 0
				if(now.weekday() == 0 and now.hour == 0 and now.minute == 0):
					print "reset week"
					weeklyCounter = 0
				if(now.hour == 0 and now.minute == 0):
					print "reset day"
					dailyCounter = 0
			
				print 'minute 5'
				newJson = self.createJson(now.hour,now.minute)
				preprelast=prelast
				prelast=lastChunkFile

				cpreprelast=cprelast
				if(len(lastChunkFile)<>0):
					cprelast='count'+lastChunkFile
						
				lock.acquire()
				lastChunkFile = newJson
				lock.release()

				time.sleep(5)
				print('deleting '+preprelast)		
				if(len(preprelast)<>0):
					os.remove(baseWebFolder+preprelast)

				print('deleting '+cpreprelast)		
				if(len(cpreprelast)<>0):
					os.remove(baseWebFolder+cpreprelast)

			else:
				time.sleep(0.4)
	
class glowHandler(BaseHTTPRequestHandler):
	def do_GET(self):
		global lastChunkFile
		global lock
		answer=''
		lock.acquire()
		if len(lastChunkFile) == 0:
			answer='error'
		else:
			answer=lastChunkFile
			print answer
		lock.release()

		self.send_response(200)
		self.send_header('Content-type', 'text/html')
		self.send_header('Content-length', len(answer))
		self.end_headers()
		self.wfile.write(answer)
	
def main():
	global stop
	dP = dataProvider()
	dP.start()
	try:
        	server = HTTPServer(('', 9999), glowHandler)
        	server.serve_forever()
	except KeyboardInterrupt:
		stop = 0
		server.socket.close()

if __name__ == '__main__':
	main()
