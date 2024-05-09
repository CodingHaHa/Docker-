FROM centos:centos8
USER root

RUN cd /etc/yum.repos.d/ && sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-* && sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-* && curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - && dnf install -y nodejs-18.20.2 && rm -rf /var/cache/dnf
COPY echarts-export-server /echarts-export-server
COPY windows_brief /usr/share/fonts
COPY base-installs  /echarts-export-server
WORKDIR /echarts-export-server/
RUN rm -rf /etc/yum.repos.d/*.repo && mv tsinghua.repo /etc/yum.repos.d/ && yum makecache &&  yum install  libjpeg-turbo-devel -y && yum install  pango-devel -y && yum install cairo-devel -y &&  echo LANG=zh_CN.UTF-8 > /etc/locale.conf && source /etc/locale.conf && export LANG=zh_CN.UTF-8 && sed -i '41 s/en_US/zh_CN/g' /etc/profile.d/lang.sh && source /etc/profile.d/lang.sh && yum install glibc-common -y &&  yum -y install glibc-locale-source glibc-langpack-en &&  localedef -c -f UTF-8 -i zh_CN zh_CN.utf8 &&  yum install mkfontscale -y &&  cd /usr/share/fonts/ &&  mkfontscale && mkfontdir && fc-cache &&  yum clean all && yum clean packages && yum clean dbcache && chmod +x /echarts-export-server/entrypoint.sh

ENV LC_ALL zh_CN.UTF-8
EXPOSE 3000
ENTRYPOINT [ "/echarts-export-server/entrypoint.sh" ]

