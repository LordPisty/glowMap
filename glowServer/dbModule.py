import _mysql
import time
import datetime

def pad(data) :
	if len(str(data)) == 1:
		return '0'+str(data)
	else :
		return str(data)

ssldict={'ca':'/com/home/users/screspi/ca-bundle.crt'}
DBhostname="db-c.bo-prod.norvax.net"
DBusername="screspi"
DBpwd="f3e2962566b0e2d51118b5fdc2295aa7"
DBname="quoteengine"

#db=_mysql.connect(host="db-c.bo-prod.norvax.net",user="screspi",passwd="f3e2962566b0e2d51118b5fdc2295aa7",db="quoteengine",ssl=ssldict)

def getCounterFrom (timeStamp):

	done = False

	while done != True :

		try :
			db=_mysql.connect(host=DBhostname,user=DBusername,passwd=DBpwd,db=DBname,ssl=ssldict)
			db.query("""select count(*) as total from quoteengine_usage where timeStamp >='"""+timeStamp+"""'""")
			r = db.store_result()
			result = r.fetch_row(maxrows=0,how=1)
			done = True
		except Exception, err:		
			print 'ERROR: %s\n' % str(err)
			time.sleep(5)

	return result

def getDailyCounter():
	counter = 0	

	now = datetime.datetime.now()
	results = getCounterFrom(str(now.year)+'-'+pad(now.month)+'-'+pad(now.day)+' 00:00:00')
	
	for result in results:
		counter = int(result['total'])

	return counter

def getWeeklyCounter():
	counter = 0	
	
	now = datetime.datetime.now()
	firstweek = now - datetime.timedelta(days=(now.weekday()))

	results = getCounterFrom(str(firstweek.year)+'-'+pad(firstweek.month)+'-'+pad(firstweek.day)+' 00:00:00')
	
	for result in results:
		counter = int(result['total'])

	return counter

def getMonthlyCounter():
	counter = 0	

	now = datetime.datetime.now()

	results = getCounterFrom(str(now.year)+'-'+pad(now.month)+'-01 00:00:00')
	
	for result in results:
		counter = int(result['total'])

	return counter

def getLogs(tS1, tS2):

	done = False

	while done != True :

		try :
			db=_mysql.connect(host=DBhostname,user=DBusername,passwd=DBpwd,db=DBname,ssl=ssldict)
			db.query("""select * from quoteengine_usage as qeu left join quoteengine_usage_details as qeud on qeu.id=qeud.quoteengine_usage_id where qeu.timeStamp >='"""+tS1+"""' and qeu.timeStamp<'"""+tS2+"""'""")
			r = db.store_result()
			result = r.fetch_row(maxrows=0,how=1)
			done = True
		except Exception, err:		
			print 'ERROR: %s\n' % str(err)
			time.sleep(5)
	return result




#Tests
#getLogs('2011-07-28 16:40:00','2011-07-28 16:45:00')
#print getDailyCounter()
#print getWeeklyCounter()
#print getMonthlyCounter()

