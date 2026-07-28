-- Expand pincode coverage to 200+ realistic Indian pincodes covering major cities and state capitals

insert into public.pincodes (pincode, city, state, is_serviceable, cod_available, est_delivery_days) values
-- Maharashtra (already have Kolhapur, Pune, Mumbai)
('400051','Mumbai','Maharashtra',true,true,3),
('400070','Mumbai','Maharashtra',true,true,3),
('411038','Pune','Maharashtra',true,true,3),
('411057','Pune','Maharashtra',true,true,3),
('416115','Kolhapur','Maharashtra',true,true,2),
('416120','Kolhapur','Maharashtra',true,true,2),
('444601','Amravati','Maharashtra',true,true,4),
('440001','Nagpur','Maharashtra',true,true,4),
('431001','Aurangabad','Maharashtra',true,true,4),
('422001','Nashik','Maharashtra',true,true,4),

-- Delhi NCR
('110011','Delhi','Delhi',true,true,5),
('110019','Delhi','Delhi',true,true,5),
('110044','Delhi','Delhi',true,true,5),
('110096','Delhi','Delhi',true,true,5),
('201301','Noida','Uttar Pradesh',true,true,5),
('201305','Noida','Uttar Pradesh',true,true,5),
('122001','Gurgaon','Haryana',true,true,5),
('122018','Gurgaon','Haryana',true,true,5),
('121001','Faridabad','Haryana',true,true,5),
('201001','Ghaziabad','Uttar Pradesh',true,true,5),

-- Karnataka
('560002','Bengaluru','Karnataka',true,true,5),
('560017','Bengaluru','Karnataka',true,true,5),
('560038','Bengaluru','Karnataka',true,true,5),
('560103','Bengaluru','Karnataka',true,true,5),
('575001','Mangalore','Karnataka',true,true,6),
('570001','Mysore','Karnataka',true,true,6),
('580001','Hubli','Karnataka',true,true,6),

-- Tamil Nadu
('600002','Chennai','Tamil Nadu',true,true,5),
('600024','Chennai','Tamil Nadu',true,true,5),
('600042','Chennai','Tamil Nadu',true,true,5),
('600100','Chennai','Tamil Nadu',true,true,5),
('641001','Coimbatore','Tamil Nadu',true,true,6),
('620001','Trichy','Tamil Nadu',true,true,6),
('625001','Madurai','Tamil Nadu',true,true,6),

-- West Bengal
('700002','Kolkata','West Bengal',true,true,6),
('700027','Kolkata','West Bengal',true,true,6),
('700053','Kolkata','West Bengal',true,true,6),
('700091','Kolkata','West Bengal',true,true,6),
('721201','Kharagpur','West Bengal',true,true,6),
('734001','Siliguri','West Bengal',true,true,6),

-- Telangana
('500003','Hyderabad','Telangana',true,true,5),
('500016','Hyderabad','Telangana',true,true,5),
('500034','Hyderabad','Telangana',true,true,5),
('500081','Hyderabad','Telangana',true,true,5),

-- Gujarat
('380002','Ahmedabad','Gujarat',true,true,5),
('380015','Ahmedabad','Gujarat',true,true,5),
('380054','Ahmedabad','Gujarat',true,true,5),
('395001','Surat','Gujarat',true,true,5),
('390001','Vadodara','Gujarat',true,true,6),
('361001','Jamnagar','Gujarat',true,true,6),
('360001','Rajkot','Gujarat',true,true,6),

-- Rajasthan
('302001','Jaipur','Rajasthan',true,true,5),
('302015','Jaipur','Rajasthan',true,true,5),
('302039','Jaipur','Rajasthan',true,true,5),
('313001','Udaipur','Rajasthan',true,true,6),
('342001','Jodhpur','Rajasthan',true,true,6),
('324001','Kota','Rajasthan',true,true,6),

-- Uttar Pradesh
('226001','Lucknow','Uttar Pradesh',true,true,5),
('226010','Lucknow','Uttar Pradesh',true,true,5),
('226022','Lucknow','Uttar Pradesh',true,true,5),
('208001','Kanpur','Uttar Pradesh',true,true,5),
('282001','Agra','Uttar Pradesh',true,true,5),
('221001','Varanasi','Uttar Pradesh',true,true,6),
('211001','Allahabad','Uttar Pradesh',true,true,6),
('250001','Meerut','Uttar Pradesh',true,true,5),

-- Punjab
('141001','Ludhiana','Punjab',true,true,5),
('160001','Chandigarh','Chandigarh',true,true,5),
('160017','Chandigarh','Chandigarh',true,true,5),
('143001','Amritsar','Punjab',true,true,6),
('151001','Bathinda','Punjab',true,true,6),
('144001','Jalandhar','Punjab',true,true,6),

-- Madhya Pradesh
('452001','Indore','Madhya Pradesh',true,true,5),
('462001','Bhopal','Madhya Pradesh',true,true,5),
('482001','Jabalpur','Madhya Pradesh',true,true,6),
('474001','Gwalior','Madhya Pradesh',true,true,6),

-- Kerala
('682001','Kochi','Kerala',true,true,6),
('695001','Thiruvananthapuram','Kerala',true,true,6),
('673001','Kozhikode','Kerala',true,true,6),
('686001','Kottayam','Kerala',true,true,6),

-- Odisha
('751001','Bhubaneswar','Odisha',true,true,6),
('753001','Cuttack','Odisha',true,true,6),

-- Bihar
('800001','Patna','Bihar',true,true,6),
('801503','Patna','Bihar',true,true,6),
('843302','Muzaffarpur','Bihar',true,true,6),

-- Assam
('781001','Guwahati','Assam',true,true,6),
('781024','Guwahati','Assam',true,true,6),

-- Jharkhand
('834001','Ranchi','Jharkhand',true,true,6),
('831001','Jamshedpur','Jharkhand',true,true,6),

-- Chhattisgarh
('492001','Raipur','Chhattisgarh',true,true,6),
('490001','Bhilai','Chhattisgarh',true,true,6),

-- Uttarakhand
('248001','Dehradun','Uttarakhand',true,true,5),
('263001','Nainital','Uttarakhand',true,true,6),

-- Himachal Pradesh
('171001','Shimla','Himachal Pradesh',true,true,6),
('176001','Dharamshala','Himachal Pradesh',true,true,6),

-- Jammu & Kashmir
('190001','Srinagar','Jammu and Kashmir',true,true,6),
('180001','Jammu','Jammu and Kashmir',true,true,6),

-- Goa
('403001','Panaji','Goa',true,true,5),
('403201','Margao','Goa',true,true,5),

-- Andhra Pradesh
('520001','Vijayawada','Andhra Pradesh',true,true,5),
('530001','Visakhapatnam','Andhra Pradesh',true,true,6),
('517501','Tirupati','Andhra Pradesh',true,true,6),

-- Additional major city pincodes
('400092','Mumbai','Maharashtra',true,true,3),
('560025','Bengaluru','Karnataka',true,true,5),
('560076','Bengaluru','Karnataka',true,true,5),
('600032','Chennai','Tamil Nadu',true,true,5),
('600078','Chennai','Tamil Nadu',true,true,5),
('700019','Kolkata','West Bengal',true,true,6),
('700064','Kolkata','West Bengal',true,true,6),
('411004','Pune','Maharashtra',true,true,3),
('411028','Pune','Maharashtra',true,true,3),
('500035','Hyderabad','Telangana',true,true,5),
('500072','Hyderabad','Telangana',true,true,5),
('380008','Ahmedabad','Gujarat',true,true,5),
('380061','Ahmedabad','Gujarat',true,true,5),
('110085','Delhi','Delhi',true,true,5),
('110062','Delhi','Delhi',true,true,5),
('302017','Jaipur','Rajasthan',true,true,5),
('302021','Jaipur','Rajasthan',true,true,5),
('641018','Coimbatore','Tamil Nadu',true,true,6),
('641035','Coimbatore','Tamil Nadu',true,true,6),
('440010','Nagpur','Maharashtra',true,true,4),
('440022','Nagpur','Maharashtra',true,true,4),
('395003','Surat','Gujarat',true,true,5),
('395007','Surat','Gujarat',true,true,5),
('462016','Bhopal','Madhya Pradesh',true,true,5),
('462042','Bhopal','Madhya Pradesh',true,true,5),
('452010','Indore','Madhya Pradesh',true,true,5),
('452018','Indore','Madhya Pradesh',true,true,5),
('226016','Lucknow','Uttar Pradesh',true,true,5),
('226025','Lucknow','Uttar Pradesh',true,true,5),
('800013','Patna','Bihar',true,true,6),
('800025','Patna','Bihar',true,true,6),
('751012','Bhubaneswar','Odisha',true,true,6),
('751024','Bhubaneswar','Odisha',true,true,6),
('682016','Kochi','Kerala',true,true,6),
('682025','Kochi','Kerala',true,true,6),
('208012','Kanpur','Uttar Pradesh',true,true,5),
('208027','Kanpur','Uttar Pradesh',true,true,5),
('282010','Agra','Uttar Pradesh',true,true,5),
('160022','Chandigarh','Chandigarh',true,true,5),
('160036','Chandigarh','Chandigarh',true,true,5),
('141008','Ludhiana','Punjab',true,true,5),
('141010','Ludhiana','Punjab',true,true,5),
('400021','Mumbai','Maharashtra',true,true,3),
('400025','Mumbai','Maharashtra',true,true,3),
('400049','Mumbai','Maharashtra',true,true,3),
('400058','Mumbai','Maharashtra',true,true,3),
('400067','Mumbai','Maharashtra',true,true,3),
('400076','Mumbai','Maharashtra',true,true,3),
('400086','Mumbai','Maharashtra',true,true,3),
('400093','Mumbai','Maharashtra',true,true,3),
('560008','Bengaluru','Karnataka',true,true,5),
('560016','Bengaluru','Karnataka',true,true,5),
('560034','Bengaluru','Karnataka',true,true,5),
('560043','Bengaluru','Karnataka',true,true,5),
('560050','Bengaluru','Karnataka',true,true,5),
('560068','Bengaluru','Karnataka',true,true,5),
('560085','Bengaluru','Karnataka',true,true,5),
('560092','Bengaluru','Karnataka',true,true,5)
on conflict (pincode) do nothing;
