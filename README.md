https://github.com/teguh2522009-hub/teguh_portofolio.git


create folder
masuk folder yang telah dibuat
git clone https://github.com/teguh2522009-hub/teguh_portofolio.git        
create file Dockerfile

masuk docker hub
cari httpd
cari paling atas > tempel di Dockerfile
FROM httpd:2.4
COPY .  /usr/local/apache2/htdocs/
hapus sampai /usr
ubah title
cmd > cd .\web1_httpd_teguh\    
docker build -t web1_httpd .                                              
docker run -d -p 8081:80 web1_httpd                 


masuk docker hub
cari nginx
cari paling atas > tempel di Dockerfile
hapus sampai /usr
ubah title
cmd > cd .\web1_httpd_teguh\    
docker build -t web1_httpd .                                              
docker run -d -p 8081:80 web1_httpd                     
